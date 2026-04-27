import { tool } from "ai";
import { z } from "zod";

import { createAbortError, raceWithAbort } from "@/lib/ai/tools/utils/abort";
import { getLogger } from "@/lib/logger";
import type { ExecuteCommandToolConfig } from "@/lib/settings/types";
import { spawnCommand } from "@/lib/shell";

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
      let aborted = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      type QueueItem =
        | { type: "stdout"; data: string }
        | { type: "stderr"; data: string }
        | { type: "done"; code: number | null }
        | { type: "error"; message: string };

      const queue: QueueItem[] = [];
      let resolveWait: (() => void) | null = null;

      const push = (item: QueueItem) => {
        queue.push(item);
        resolveWait?.();
        resolveWait = null;
      };

      const waitForNextQueueItem = () =>
        new Promise<void>((resolve) => {
          resolveWait = resolve;
        });

      const waitForTrailingEvents = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

      const proc = await raceWithAbort(
        spawnCommand(
          { command: input.command },
          (data) => {
            stdout += data;
            push({ type: "stdout", data });
          },
          (data) => {
            stderr += data;
            push({ type: "stderr", data });
          },
        ),
        abortSignal,
      );

      if (aborted) {
        void proc.kill().catch(() => {});
        throw createAbortError();
      }

      let done = false;
      let exitCode: number | null = null;
      let errorMessage: string | null = null;

      proc.exited
        .then(({ code }) => {
          exitCode = code;
          done = true;
          push({ type: "done", code });
        })
        .catch((err: unknown) => {
          errorMessage = err instanceof Error ? err.message : String(err);
          done = true;
          push({ type: "error", message: errorMessage! });
        });

      const onAbort = () => {
        aborted = true;
        if (timeoutId) clearTimeout(timeoutId);
        void proc.kill().catch(() => {});
        resolveWait?.();
        resolveWait = null;
      };

      abortSignal?.addEventListener("abort", onAbort, { once: true });

      timeoutId = setTimeout(() => {
        timedOut = true;
        void proc.kill().catch(() => {});
      }, timeoutMs);

      try {
        while (!done || queue.length > 0) {
          if (aborted) throw createAbortError();

          if (queue.length === 0) {
            if (done) {
              await raceWithAbort(waitForTrailingEvents(), abortSignal);
              if (queue.length === 0) break;
            } else {
              await raceWithAbort(waitForNextQueueItem(), abortSignal);
            }
          }

          while (queue.length > 0) {
            if (aborted) throw createAbortError();

            const item = queue.shift()!;
            if (item.type === "done") {
              done = true;
              exitCode = item.code;
              continue;
            }
            if (item.type === "error") {
              errorMessage = item.message;
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

        if (errorMessage) throw new Error(errorMessage);

        logger.verbose("Command executed:", {
          exitCode,
          stdoutLen: stdout.length,
          stderrLen: stderr.length,
        });

        return {
          stdout,
          stderr,
          exitCode,
          signal: null,
          timedOut,
        } as ExecuteCommandOutput;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        abortSignal?.removeEventListener("abort", onAbort);
      }
    },
  });
