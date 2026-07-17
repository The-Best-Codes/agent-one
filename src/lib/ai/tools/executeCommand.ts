import { tool } from "ai";
import { z } from "zod";

import { createAbortError, raceWithAbort } from "@/lib/ai/tools/utils/abort";
import { getLogger } from "@/lib/logger";
import { spawnCommand } from "@/lib/run-command";
import type { ExecuteCommandToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export interface ExecuteCommandOutput {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: number | null;
  timedOut: boolean;
  skipped?: boolean;
  stopped?: boolean;
}

export type ExecuteCommandLiveStatus = "running" | "skipped-running" | "stopping" | "completed";

export interface ExecuteCommandLiveState {
  toolCallId: string;
  startedAt: number;
  endedAt: number | null;
  status: ExecuteCommandLiveStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: number | null;
  timedOut: boolean;
  skipRequested: boolean;
  stopRequested: boolean;
}

const executeCommandLiveStateMap = new Map<string, ExecuteCommandLiveState>();
const executeCommandListenersMap = new Map<string, Set<() => void>>();
const executeCommandKillMap = new Map<string, () => Promise<void>>();
const executeCommandWakeMap = new Map<string, () => void>();

const getLiveState = (toolCallId: string) => executeCommandLiveStateMap.get(toolCallId);

const emitLiveState = (toolCallId: string) => {
  const listeners = executeCommandListenersMap.get(toolCallId);
  if (!listeners) return;
  for (const listener of listeners) {
    listener();
  }
};

const updateLiveState = (
  toolCallId: string,
  updater: (state: ExecuteCommandLiveState) => ExecuteCommandLiveState,
) => {
  const current = getLiveState(toolCallId);
  if (!current) return;
  executeCommandLiveStateMap.set(toolCallId, updater(current));
  emitLiveState(toolCallId);
};

export const getExecuteCommandLiveState = (toolCallId: string) => getLiveState(toolCallId);

export const subscribeExecuteCommandLiveState = (toolCallId: string, listener: () => void) => {
  const listeners = executeCommandListenersMap.get(toolCallId) ?? new Set<() => void>();
  listeners.add(listener);
  executeCommandListenersMap.set(toolCallId, listeners);

  return () => {
    const currentListeners = executeCommandListenersMap.get(toolCallId);
    if (!currentListeners) return;
    currentListeners.delete(listener);
    if (currentListeners.size === 0) {
      executeCommandListenersMap.delete(toolCallId);
    }
  };
};

export const skipExecuteCommand = (toolCallId: string) => {
  updateLiveState(toolCallId, (state) => {
    if (state.status !== "running") {
      return state;
    }
    return {
      ...state,
      status: "skipped-running",
      skipRequested: true,
    };
  });
  executeCommandWakeMap.get(toolCallId)?.();
};

export const stopExecuteCommand = (toolCallId: string) => {
  updateLiveState(toolCallId, (state) => {
    if (state.status === "completed") {
      return state;
    }
    return {
      ...state,
      status: "stopping",
      stopRequested: true,
    };
  });

  const kill = executeCommandKillMap.get(toolCallId);
  if (kill) {
    void kill();
  }
  executeCommandWakeMap.get(toolCallId)?.();
};

export const createExecuteCommandTool = (config: ExecuteCommandToolConfig) =>
  tool({
    description:
      "Execute a terminal command and return its output. Works on Windows, macOS, and Linux. Use this for running shell commands, scripts, build tools, git operations, and any other command-line tasks.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      command: z.string().describe("The command to execute (passed to the system shell)"),
      timeoutMs: z
        .number()
        .optional()
        .default(config.defaultTimeoutMs)
        .describe("Optional timeout in milliseconds"),
    }),
    execute: async function* (input, { abortSignal, toolCallId }) {
      logger.verbose("Executing executeCommand tool with input:", input);

      abortSignal?.throwIfAborted();

      const timeoutMs = input.timeoutMs ?? config.defaultTimeoutMs;

      const startedAt = Date.now();
      executeCommandLiveStateMap.set(toolCallId, {
        toolCallId,
        startedAt,
        endedAt: null,
        status: "running",
        stdout: "",
        stderr: "",
        exitCode: null,
        signal: null,
        timedOut: false,
        skipRequested: false,
        stopRequested: false,
      });
      emitLiveState(toolCallId);

      let stdout = "";
      let stderr = "";
      let pendingStdout = "";
      let pendingStderr = "";
      let flushTimeoutId: ReturnType<typeof setTimeout> | null = null;
      let timedOut = false;
      let done = false;
      let exitCode: number | null = null;
      let signal: number | null = null;

      const truncateScrollback = (text: string) => {
        const maxChars = config.maxScrollbackChars;
        if (maxChars <= 0 || text.length <= maxChars) return text;
        const marker = `[truncated to ${maxChars} characters]\n`;
        const available = Math.max(0, maxChars - marker.length);
        return marker + text.slice(-available);
      };

      const flush = () => {
        if (flushTimeoutId) {
          clearTimeout(flushTimeoutId);
          flushTimeoutId = null;
        }

        if (pendingStdout || pendingStderr) {
          if (pendingStdout) {
            stdout = truncateScrollback(stdout + pendingStdout);
            pendingStdout = "";
          }
          if (pendingStderr) {
            stderr = truncateScrollback(stderr + pendingStderr);
            pendingStderr = "";
          }

          updateLiveState(toolCallId, (state) => ({ ...state, stdout, stderr }));
          push({ type: "stdout" });
        }
      };

      const queueUpdate = (type: "stdout" | "stderr", data: string) => {
        if (type === "stdout") {
          pendingStdout += data;
        } else {
          pendingStderr += data;
        }

        if (!flushTimeoutId) {
          flushTimeoutId = setTimeout(flush, 100);
        }
      };

      type QueueItem = { type: "stdout" } | { type: "done" };

      const queue: QueueItem[] = [];
      let resolveWait: (() => void) | null = null;

      const push = (item: QueueItem) => {
        queue.push(item);
        resolveWait?.();
        resolveWait = null;
      };

      const controller = new AbortController();

      const combinedSignal = (() => {
        if (!abortSignal) return controller.signal;
        if (abortSignal.aborted) {
          controller.abort();
          return controller.signal;
        }
        const onAbort = () => controller.abort();
        abortSignal.addEventListener("abort", onAbort, { once: true });
        controller.signal.addEventListener(
          "abort",
          () => abortSignal.removeEventListener("abort", onAbort),
          { once: true },
        );
        return controller.signal;
      })();

      const { handle, result } = spawnCommand(input.command, {
        signal: combinedSignal,
        onStdout: (data) => {
          queueUpdate("stdout", data);
        },
        onStderr: (data) => {
          queueUpdate("stderr", data);
        },
      });

      executeCommandKillMap.set(toolCallId, () => handle.kill());

      const timeoutId = setTimeout(() => {
        timedOut = true;
        updateLiveState(toolCallId, (state) => ({
          ...state,
          timedOut: true,
          status: state.status === "completed" ? state.status : "stopping",
        }));
        void handle.kill();
      }, timeoutMs);

      result
        .then((r) => {
          exitCode = r.exitCode;
          signal = r.signal;
        })
        .catch(() => {})
        .finally(() => {
          done = true;
          flush();
          const endedAt = Date.now();
          updateLiveState(toolCallId, (state) => ({
            ...state,
            endedAt,
            status: "completed",
            exitCode,
            signal,
            timedOut,
          }));
          clearTimeout(timeoutId);
          executeCommandKillMap.delete(toolCallId);
          executeCommandWakeMap.delete(toolCallId);
          push({ type: "done" });
        });

      const waitForNext = () =>
        new Promise<void>((resolve) => {
          resolveWait = resolve;
        });

      executeCommandWakeMap.set(toolCallId, () => {
        resolveWait?.();
        resolveWait = null;
      });

      try {
        while (!done || queue.length > 0) {
          if (combinedSignal.aborted) {
            throw createAbortError();
          }

          const liveState = getLiveState(toolCallId);
          if (liveState?.stopRequested || liveState?.skipRequested) {
            break;
          }

          if (queue.length === 0) {
            await raceWithAbort(waitForNext(), abortSignal);
          }

          while (queue.length > 0) {
            if (combinedSignal.aborted) {
              throw createAbortError();
            }

            const currentLiveState = getLiveState(toolCallId);
            if (currentLiveState?.stopRequested || currentLiveState?.skipRequested) {
              break;
            }

            const item = queue.shift()!;
            if (item.type === "done") {
              done = true;
              continue;
            }

            yield {
              stdout,
              stderr,
              exitCode: null,
              signal: null,
              timedOut: false,
            } as ExecuteCommandOutput;
          }

          const updatedLiveState = getLiveState(toolCallId);
          if (updatedLiveState?.stopRequested || updatedLiveState?.skipRequested) {
            break;
          }
        }

        const finalLiveState = getLiveState(toolCallId);
        if (finalLiveState?.stopRequested || finalLiveState?.skipRequested) {
          yield {
            stdout,
            stderr,
            exitCode: null,
            signal: null,
            timedOut,
            skipped: finalLiveState.skipRequested,
            stopped: finalLiveState.stopRequested,
          } as ExecuteCommandOutput;
          return;
        }

        await result.catch(() => {});

        logger.verbose("Command executed:", {
          exitCode,
          stdoutLen: stdout.length,
          stderrLen: stderr.length,
        });

        yield {
          stdout,
          stderr,
          exitCode,
          signal,
          timedOut,
        } as ExecuteCommandOutput;
      } finally {
        if (flushTimeoutId) {
          clearTimeout(flushTimeoutId);
        }
      }
    },
  });
