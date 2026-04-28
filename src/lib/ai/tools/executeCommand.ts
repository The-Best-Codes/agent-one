import { tool } from "ai";
import { z } from "zod";

import { createAbortError } from "@/lib/ai/tools/utils/abort";
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
}

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
        .describe("Optional timeout in milliseconds (default: 120000)"),
    }),
    execute: async function* (input, { abortSignal }) {
      logger.verbose("Executing executeCommand tool with input:", input);

      abortSignal?.throwIfAborted();

      const timeoutMs = input.timeoutMs ?? config.defaultTimeoutMs;

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      type QueueItem =
        | { type: "stdout"; data: string }
        | { type: "stderr"; data: string }
        | { type: "done" };

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
          stdout += data;
          push({ type: "stdout", data });
        },
        onStderr: (data) => {
          stderr += data;
          push({ type: "stderr", data });
        },
      });

      let done = false;
      let exitCode: number | null = null;
      let signal: number | null = null;

      const timeoutId = setTimeout(() => {
        timedOut = true;
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
          push({ type: "done" });
        });

      const waitForNext = () =>
        new Promise<void>((resolve) => {
          resolveWait = resolve;
        });

      try {
        while (!done || queue.length > 0) {
          if (combinedSignal.aborted) {
            throw createAbortError();
          }

          if (queue.length === 0) {
            await waitForNext();
          }

          while (queue.length > 0) {
            if (combinedSignal.aborted) {
              throw createAbortError();
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
        }

        await result.catch(() => {});

        logger.verbose("Command executed:", {
          exitCode,
          stdoutLen: stdout.length,
          stderrLen: stderr.length,
        });

        return {
          stdout,
          stderr,
          exitCode,
          signal,
          timedOut,
        } as ExecuteCommandOutput;
      } finally {
        clearTimeout(timeoutId);
      }
    },
  });
