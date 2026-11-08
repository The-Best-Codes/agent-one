import { platform } from "@tauri-apps/plugin-os";
import { type Child, Command } from "@tauri-apps/plugin-shell";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export interface RunCommandOptions {
  env?: Record<string, string>;
  cwd?: string;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
  signal?: AbortSignal;
  windowsShell?: "cmd" | "powershell";
}

export interface RunCommandResult {
  exitCode: number | null;
  signal: number | null;
}

export interface RunCommandHandle {
  write(data: string): Promise<void>;
  kill(): Promise<void>;
}

export interface RunCommandProcess {
  handle: RunCommandHandle;
  result: Promise<RunCommandResult>;
}

const CODE_PAGE_ENCODINGS: Record<string, string> = {
  "866": "ibm866",
  "932": "shift_jis",
  "936": "gbk",
  "949": "euc-kr",
  "950": "big5",
  "65001": "utf-8",
};

let outputEncodingPromise: Promise<string> | null = null;

async function detectOutputEncoding(): Promise<string> {
  if (platform() !== "windows") return "utf-8";

  try {
    const output = await Command.create("cmd", ["/C", "chcp"], { encoding: "raw" }).execute();
    const codePage = new TextDecoder().decode(new Uint8Array(output.stdout)).match(/\d+/)?.[0];
    if (!codePage) return "utf-8";

    const encoding = CODE_PAGE_ENCODINGS[codePage] ?? `windows-${codePage}`;
    new TextDecoder(encoding);
    return encoding;
  } catch (err) {
    logger.verbose("Failed to detect console code page:", err);
    return "utf-8";
  }
}

function getOutputEncoding(): Promise<string> {
  outputEncodingPromise ??= detectOutputEncoding();
  return outputEncodingPromise;
}

function createOutputDecoder(fallbackEncoding: string) {
  let utf8 = new TextDecoder("utf-8", { fatal: true });
  const fallback = new TextDecoder(fallbackEncoding);

  return (chunk?: Uint8Array): string => {
    try {
      return utf8.decode(chunk, { stream: chunk !== undefined });
    } catch {
      utf8 = new TextDecoder("utf-8", { fatal: true });
      return chunk ? fallback.decode(chunk) : "";
    }
  };
}

const COMMAND_ENV = "AGENT_ONE_COMMAND";

function buildShellArgs(
  command: string,
  windowsShell: RunCommandOptions["windowsShell"] = "cmd",
): { program: string; args: string[]; env?: Record<string, string> } {
  const isWindows = platform() === "windows";
  if (isWindows) {
    return windowsShell === "powershell"
      ? {
          program: "powershell",
          args: [
            "-NoLogo",
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            `$ProgressPreference = 'SilentlyContinue'; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Invoke-Expression $env:${COMMAND_ENV}`,
          ],
          env: {
            [COMMAND_ENV]: `${command}\nif (-not $?) { if ($LASTEXITCODE) { exit $LASTEXITCODE } else { exit 1 } }`,
          },
        }
      : command.includes('"')
        ? // Arguments containing quotes get backslash-escaped, which cmd doesn't understand
          { program: "cmd", args: ["/C", `%${COMMAND_ENV}%`], env: { [COMMAND_ENV]: command } }
        : { program: "cmd", args: ["/C", command] };
  }

  return platform() === "macos"
    ? { program: "zsh", args: ["-c", command] }
    : { program: "sh", args: ["-c", command] };
}

export function spawnCommand(command: string, options: RunCommandOptions = {}): RunCommandProcess {
  const { program, args, env: shellEnv } = buildShellArgs(command, options.windowsShell);
  const env = { ...options.env, ...shellEnv };
  const spawnOptions: { env?: Record<string, string>; cwd?: string } = {};
  if (Object.keys(env).length > 0) spawnOptions.env = env;
  if (options.cwd) spawnOptions.cwd = options.cwd;

  const cmd = Command.create(program, args, { ...spawnOptions, encoding: "raw" });
  let decodeStdout = createOutputDecoder("utf-8");
  let decodeStderr = createOutputDecoder("utf-8");

  let child: Child | null = null;
  let killed = false;
  let resolveResult!: (result: RunCommandResult) => void;
  let rejectResult!: (err: unknown) => void;

  const result = new Promise<RunCommandResult>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  const emitStdout = (text: string) => {
    if (text) options.onStdout?.(text);
  };

  const emitStderr = (text: string) => {
    if (text) options.onStderr?.(text);
  };

  cmd.stdout.on("data", (data) => {
    emitStdout(decodeStdout(new Uint8Array(data)));
  });

  cmd.stderr.on("data", (data) => {
    emitStderr(decodeStderr(new Uint8Array(data)));
  });

  cmd.on("close", (data: { code: number | null; signal: number | null }) => {
    emitStdout(decodeStdout());
    emitStderr(decodeStderr());
    resolveResult({ exitCode: data.code, signal: data.signal });
  });

  cmd.on("error", (error: string) => {
    rejectResult(new Error(error));
  });

  const killTree = async (pid: number) => {
    // Weird and crazy looking commands to kill a process tree (all children and the parent)
    // Hopefully this doesn't cause any issues later.
    const isWindows = platform() === "windows";
    const killCmd = isWindows
      ? Command.create("cmd", [
          "/C",
          `taskkill /T /PID ${pid} & ping -n 2 127.0.0.1 >nul & taskkill /T /F /PID ${pid}`,
        ])
      : Command.create("sh", [
          "-c",
          `kill_tree() { sig=$1; p=$2; for c in $(pgrep -P "$p" 2>/dev/null); do kill_tree "$sig" "$c"; done; kill -"$sig" "$p" 2>/dev/null; }; kill_tree TERM ${pid}; sleep 0.2; kill_tree KILL ${pid}`,
        ]);
    await killCmd.execute().catch((err) => {
      logger.error("Failed to kill process tree:", err);
    });
  };

  const kill = async () => {
    if (killed || !child) return;
    killed = true;
    await killTree(child.pid);
    await child.kill().catch((err) => {
      logger.verbose("Failed to kill child process:", err);
    });
  };

  const onAbort = () => {
    void kill();
  };

  options.signal?.addEventListener("abort", onAbort, { once: true });

  const spawnPromise = getOutputEncoding()
    .then((encoding) => {
      decodeStdout = createOutputDecoder(encoding);
      decodeStderr = createOutputDecoder(encoding);
      return cmd.spawn();
    })
    .then((c) => {
      child = c;
      if (options.signal?.aborted) {
        void kill();
      }
    });

  spawnPromise.catch((err: unknown) => {
    rejectResult(err);
  });

  const handle: RunCommandHandle = {
    write: async (data: string) => {
      if (!child) await spawnPromise;
      await child!.write(data);
    },
    kill,
  };

  const wrappedResult = result.finally(() => {
    options.signal?.removeEventListener("abort", onAbort);
  });

  return { handle, result: wrappedResult };
}

export async function runCommand(
  command: string,
  options: RunCommandOptions = {},
): Promise<RunCommandResult> {
  const { result } = spawnCommand(command, options);
  return result;
}

export async function isCommandAvailable(command: string): Promise<boolean> {
  if (!command.trim()) {
    return false;
  }

  const checkCommand = platform() === "windows" ? `where ${command}` : `command -v ${command}`;

  try {
    const result = await runCommand(checkCommand);
    return result.exitCode === 0;
  } catch {
    return false;
  }
}
