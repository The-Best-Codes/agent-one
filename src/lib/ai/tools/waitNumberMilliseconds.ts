import { tool } from "ai";
import { z } from "zod";

import type { WaitToolConfig } from "@/lib/settings/types";

export const createWaitTool = (config: WaitToolConfig) =>
  tool({
    description: `Wait for a specified number of milliseconds (min ${config.minMs}ms, max ${config.maxMs}ms)`,
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      milliseconds: z
        .number()
        .min(config.minMs)
        .max(config.maxMs)
        .default(Math.min(1000, config.maxMs)),
    }),
    execute: async (input, { abortSignal }) => {
      const clampedMs = Math.max(
        config.minMs,
        Math.min(config.maxMs, input.milliseconds),
      );

      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(resolve, clampedMs);

        abortSignal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timeoutId);
            const abortError = new Error("The operation was aborted.");
            abortError.name = "AbortError";
            reject(abortError);
          },
          { once: true },
        );
      });

      return {
        status: "success",
        waitedMs: clampedMs,
        schema: {
          status: "The wait status (success, aborted)",
          waitedMs: "The actual number of milliseconds waited",
        },
      };
    },
  });
