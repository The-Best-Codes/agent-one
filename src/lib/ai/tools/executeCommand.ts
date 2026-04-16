import { platform } from "@tauri-apps/plugin-os";
import { Command } from "@tauri-apps/plugin-shell";
import { tool } from "ai";
import { z } from "zod";

import { getLogger } from "@/lib/logger";
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
      const currentPlatform = platform();
      const isWindows = currentPlatform === "windows";

      const shellCmd = isWindows ? "cmd" : "sh";
      const shellArgs = isWindows ? ["/C", input.command] : ["-c", input.command];

      const command = Command.create(shellCmd, shellArgs);

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      type QueueItem =
        | { type: "stdout"; data: string }
        | { type: "stderr"; data: string }
        | { type: "done"; code: number | null; signal: number | null }
        | { type: "error"; message: string };

      const queue: QueueItem[] = [];
      let resolveWait: (() => void) | null = null;

      const push = (item: QueueItem) => {
        queue.push(item);
        if (resolveWait) {
          resolveWait();
          resolveWait = null;
        }
      };

      command.stdout.on("data", (line: string) => {
        stdout += line + "\n";
        push({ type: "stdout", data: line });
      });

      command.stderr.on("data", (line: string) => {
        stderr += line + "\n";
        push({ type: "stderr", data: line });
      });

      let done = false;
      let exitCode: number | null = null;
      let signal: number | null = null;

      command.on("error", (error: string) => {
        push({ type: "error", message: error });
      });

      command.on("close", (data: { code: number | null; signal: number | null }) => {
        exitCode = data.code;
        signal = data.signal;
        done = true;
        push({ type: "done", code: data.code, signal: data.signal });
      });

      const child = await command.spawn();

      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill().catch(() => {});
      }, timeoutMs);

      if (abortSignal) {
        abortSignal.addEventListener(
          "abort",
          () => {
            clearTimeout(timeoutId);
            child.kill().catch(() => {});
            done = true;
            push({ type: "done", code: null, signal: null });
          },
          { once: true },
        );
      }

      while (!done) {
        if (queue.length === 0) {
          await new Promise<void>((resolve) => {
            resolveWait = resolve;
          });
        }

        while (queue.length > 0) {
          const item = queue.shift()!;
          if (item.type === "done") {
            done = true;
            exitCode = item.code;
            signal = item.signal;
            break;
          }
          if (item.type === "error") {
            done = true;
            break;
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

      clearTimeout(timeoutId);

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
    },
  });
