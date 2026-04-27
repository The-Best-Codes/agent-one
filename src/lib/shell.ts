import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface SpawnOptions {
  command: string;
  env?: Record<string, string>;
  cwd?: string;
}

export interface SpawnedProcess {
  pid: number;
  /** Write a string to the process's stdin. */
  writeStdin: (data: string) => Promise<void>;
  /** Kill the process. */
  kill: () => Promise<void>;
  /** Resolves when the process exits. Rejects on spawn-level error. */
  exited: Promise<{ code: number | null }>;
}

interface StdoutEvent {
  pid: number;
  data: string;
}
interface StderrEvent {
  pid: number;
  data: string;
}
interface CloseEvent {
  pid: number;
  code: number | null;
}
interface ErrorEvent {
  pid: number;
  message: string;
}

/**
 * Spawn a shell command.
 *
 * On macOS/Linux the command string is passed to `sh -c`.
 * On Windows it is passed to `cmd /C`.
 *
 * @param options.command  Full command string, e.g. `"npm run dev -- --host"`
 * @param options.env      Optional environment variables to merge in
 * @param options.cwd      Optional working directory
 * @param onStdout         Called with each line of stdout (includes trailing `\n`)
 * @param onStderr         Called with each line of stderr (includes trailing `\n`)
 */
export async function spawnCommand(
  options: SpawnOptions,
  onStdout?: (data: string) => void,
  onStderr?: (data: string) => void,
): Promise<SpawnedProcess> {
  const pid = await invoke<number>("shell_spawn", { options });

  const unlisteners: UnlistenFn[] = [];

  let resolveExited!: (value: { code: number | null }) => void;
  let rejectExited!: (reason: Error) => void;
  const exited = new Promise<{ code: number | null }>((res, rej) => {
    resolveExited = res;
    rejectExited = rej;
  });

  const cleanup = () => {
    for (const fn of unlisteners) fn();
    unlisteners.length = 0;
  };

  // Wire up event listeners.
  // For now, filter by PID so multiple concurrent processes don't interfere with each other.
  const [unStdout, unStderr, unClose, unError] = await Promise.all([
    listen<StdoutEvent>("shell:stdout", (ev) => {
      if (ev.payload.pid !== pid) return;
      onStdout?.(ev.payload.data);
    }),
    listen<StderrEvent>("shell:stderr", (ev) => {
      if (ev.payload.pid !== pid) return;
      onStderr?.(ev.payload.data);
    }),
    listen<CloseEvent>("shell:close", (ev) => {
      if (ev.payload.pid !== pid) return;
      cleanup();
      resolveExited({ code: ev.payload.code });
    }),
    listen<ErrorEvent>("shell:error", (ev) => {
      if (ev.payload.pid !== pid) return;
      cleanup();
      rejectExited(new Error(ev.payload.message));
    }),
  ]);

  unlisteners.push(unStdout, unStderr, unClose, unError);

  return {
    pid,
    writeStdin: (data: string) => invoke<void>("shell_write_stdin", { pid, data }),
    kill: () => invoke<void>("shell_kill", { pid }),
    exited,
  };
}
