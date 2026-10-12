import { join, tempDir } from "@tauri-apps/api/path";
import { mkdir, remove, writeTextFile } from "@tauri-apps/plugin-fs";
import { arch, platform } from "@tauri-apps/plugin-os";
import { Command } from "@tauri-apps/plugin-shell";

import { getLogger } from "@/lib/logger";
import { isCommandAvailable, type RunCommandOptions, spawnProcess } from "@/lib/run-command";

const logger = getLogger(import.meta.url);

const OPENSHELL = "openshell";
const SANDBOX_NAME = "agent-one";
const OPENSHELL_ENV = { NO_COLOR: "1" };

export const SANDBOX_WORKDIR = "/sandbox";
export const OPENSHELL_INSTALL_URL = "https://docs.nvidia.com/openshell/latest/about/installation";

export const describeSandboxFileTool = (description: string, sandboxed: boolean) =>
  sandboxed
    ? `${description} Paths refer to files inside an isolated Linux sandbox, not on the user's computer. Relative paths start in ${SANDBOX_WORKDIR}.`
    : description;

export type SandboxStatus = "unsupported" | "not-installed" | "not-running" | "ready";

interface OpenShellResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export function isSandboxPlatformSupported(): boolean {
  const os = platform();
  if (os === "linux") return true;
  return os === "macos" && arch() === "aarch64";
}

async function openshell(args: string[]): Promise<OpenShellResult> {
  const output = await Command.create(OPENSHELL, args, { env: OPENSHELL_ENV }).execute();
  return { code: output.code, stdout: output.stdout, stderr: output.stderr };
}

function getErrorMessage(result: OpenShellResult, fallback: string): string {
  return result.stderr.trim() || result.stdout.trim() || fallback;
}

export async function getSandboxStatus(): Promise<SandboxStatus> {
  if (!isSandboxPlatformSupported()) return "unsupported";
  if (!(await isCommandAvailable(OPENSHELL))) return "not-installed";

  try {
    const result = await openshell(["status"]);
    return result.code === 0 ? "ready" : "not-running";
  } catch (error) {
    logger.error("Failed to check OpenShell status:", error);
    return "not-running";
  }
}

let sandboxReadyPromise: Promise<void> | null = null;

async function startOrCreateSandbox(): Promise<void> {
  if (!isSandboxPlatformSupported()) {
    throw new Error("The sandbox is turned on, but it isn't supported on this device.");
  }

  const started = await openshell(["sandbox", "start", SANDBOX_NAME]);
  if (started.code === 0) return;

  logger.verbose("Creating OpenShell sandbox:", getErrorMessage(started, "not found"));

  const created = await openshell([
    "sandbox",
    "create",
    "--name",
    SANDBOX_NAME,
    "--detach",
    "--no-tty",
    "--",
    "sleep",
    "infinity",
  ]);
  if (created.code !== 0) {
    throw new Error(
      `The sandbox is turned on, but it couldn't be started. Make sure OpenShell is installed and running. ${getErrorMessage(created, "")}`.trim(),
    );
  }
}

export function ensureSandbox(): Promise<void> {
  sandboxReadyPromise ??= startOrCreateSandbox().catch((error: unknown) => {
    sandboxReadyPromise = null;
    throw error;
  });
  return sandboxReadyPromise;
}

export function invalidateSandbox() {
  sandboxReadyPromise = null;
}

export function spawnSandboxCommand(
  command: string,
  timeoutMs: number,
  options: Omit<RunCommandOptions, "cwd" | "env"> = {},
) {
  return spawnProcess(
    OPENSHELL,
    [
      "sandbox",
      "exec",
      "-n",
      SANDBOX_NAME,
      "--no-tty",
      "--timeout",
      String(Math.max(1, Math.ceil(timeoutMs / 1000))),
      "--",
      "sh",
      "-c",
      command,
    ],
    { ...options, env: OPENSHELL_ENV },
  );
}

const RESOLVE_PATH_SCRIPT = `p=$1
case $p in "~") p=\${HOME:-$(pwd)} ;; "~/"*) p=\${HOME:-$(pwd)}/\${p#"~/"} ;; esac
case $p in /*) ;; *) p=$(pwd)/$p ;; esac
`;

async function runSandboxScript(script: string, args: string[]): Promise<string> {
  await ensureSandbox();
  const result = await openshell([
    "sandbox",
    "exec",
    "-n",
    SANDBOX_NAME,
    "--no-tty",
    "--no-login-shell",
    "--",
    "sh",
    "-c",
    RESOLVE_PATH_SCRIPT + script,
    "sh",
    ...args,
  ]);

  if (result.code !== 0) {
    invalidateSandbox();
    throw new Error(getErrorMessage(result, "The sandbox command failed."));
  }

  return result.stdout;
}

function splitFirstLine(text: string): [string, string] {
  const index = text.indexOf("\n");
  return index === -1 ? [text, ""] : [text.slice(0, index), text.slice(index + 1)];
}

export async function readSandboxFile(filePath: string): Promise<string> {
  return runSandboxScript(`cat -- "$p"`, [filePath]);
}

export async function readSandboxFileWithPath(
  filePath: string,
): Promise<{ path: string; content: string }> {
  const output = await runSandboxScript(`printf '%s\\n' "$p" && cat -- "$p"`, [filePath]);
  const [path, content] = splitFirstLine(output);
  return { path, content };
}

export async function prepareSandboxFileWrite(
  filePath: string,
  options: { overwrite: boolean; createParentDirs: boolean },
): Promise<{ path: string; existed: boolean }> {
  const output = await runSandboxScript(
    `existed=0
if [ -d "$p" ]; then
  echo "A folder already exists at this path." >&2
  exit 3
elif [ -e "$p" ]; then
  if [ "$2" != 1 ]; then
    echo "File already exists. Set overwrite to true to overwrite the existing file." >&2
    exit 3
  fi
  existed=1
elif [ "$3" = 1 ]; then
  mkdir -p -- "$(dirname -- "$p")" || exit 1
fi
printf '%s\\n%s' "$existed" "$p"`,
    [filePath, options.overwrite ? "1" : "0", options.createParentDirs ? "1" : "0"],
  );
  const [existed, path] = splitFirstLine(output);
  return { path, existed: existed === "1" };
}

export async function writeSandboxFile(absolutePath: string, content: string): Promise<void> {
  const separatorIndex = absolutePath.lastIndexOf("/");
  const parentDir = absolutePath.slice(0, separatorIndex) || "/";
  const fileName = absolutePath.slice(separatorIndex + 1);
  if (!fileName) throw new Error("A file name is required.");

  const stagingDir = await join(await tempDir(), `agent-one-sandbox-${crypto.randomUUID()}`);
  await mkdir(stagingDir, { recursive: true });

  try {
    const stagingFile = await join(stagingDir, fileName);
    await writeTextFile(stagingFile, content);

    await ensureSandbox();
    const result = await openshell([
      "sandbox",
      "upload",
      SANDBOX_NAME,
      stagingFile,
      parentDir.endsWith("/") ? parentDir : `${parentDir}/`,
      "--no-git-ignore",
    ]);

    if (result.code !== 0) {
      invalidateSandbox();
      throw new Error(getErrorMessage(result, "Couldn't write the file in the sandbox."));
    }
  } finally {
    await remove(stagingDir, { recursive: true }).catch((error: unknown) => {
      logger.error("Failed to clean up sandbox staging directory:", error);
    });
  }
}

export async function deleteSandboxFile(filePath: string): Promise<void> {
  await runSandboxScript(
    `if [ ! -e "$p" ] && [ ! -L "$p" ]; then
  echo "File does not exist." >&2
  exit 3
fi
rm -f -- "$p"`,
    [filePath],
  );
}
