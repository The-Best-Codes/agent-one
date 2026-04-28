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

function buildShellArgs(command: string): { program: string; args: string[] } {
  const isWindows = platform() === "windows";
  return isWindows
    ? { program: "cmd", args: ["/C", command] }
    : { program: "sh", args: ["-c", command] };
}

export function spawnCommand(command: string, options: RunCommandOptions = {}): RunCommandProcess {
  const { program, args } = buildShellArgs(command);
  const spawnOptions: { env?: Record<string, string>; cwd?: string } = {};
  if (options.env && Object.keys(options.env).length > 0) spawnOptions.env = options.env;
  if (options.cwd) spawnOptions.cwd = options.cwd;

  const cmd = Command.create(program, args, spawnOptions);

  let child: Child | null = null;
  let resolveResult!: (result: RunCommandResult) => void;
  let rejectResult!: (err: unknown) => void;

  const result = new Promise<RunCommandResult>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  cmd.stdout.on("data", (data: string) => {
    options.onStdout?.(data);
  });

  cmd.stderr.on("data", (data: string) => {
    options.onStderr?.(data);
  });

  cmd.on("close", (data: { code: number | null; signal: number | null }) => {
    resolveResult({ exitCode: data.code, signal: data.signal });
  });

  cmd.on("error", (error: string) => {
    rejectResult(new Error(error));
  });

  const kill = async () => {
    if (child) {
      await child.kill().catch((err) => {
        logger.error("Failed to kill child process:", err);
      });
    }
  };

  const onAbort = () => {
    void kill();
  };

  options.signal?.addEventListener("abort", onAbort, { once: true });

  const spawnPromise = cmd.spawn().then((c) => {
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
