import { tool } from "ai";
import { z } from "zod";

export const WaitNumberMillisecondsTool = tool({
  name: "waitNumberMilliseconds",
  description:
    "Wait for a specified number of milliseconds (min 0 milliseconds, max 60,000 milliseconds)",
  inputSchema: z.object({
    milliseconds: z.number().min(0).max(60000).default(1000),
  }),
  execute: async (input, { abortSignal }) => {
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(resolve, input.milliseconds);

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
      schema: {
        status: "The wait status (success, aborted)",
      },
    };
  },
});
