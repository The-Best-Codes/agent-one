import { tool } from "ai";
import { z } from "zod";

export const WaitNumberMillisecondsTool = tool({
  name: "waitNumberMilliseconds",
  description:
    "Wait for a specified number of milliseconds (min 0 milliseconds, max 10,000 milliseconds)",
  inputSchema: z.object({
    milliseconds: z.number().min(0).max(10000).default(1000),
  }),
  execute: async (input, { abortSignal }) => {
    try {
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, input.milliseconds);

        if (abortSignal) {
          abortSignal.addEventListener(
            "abort",
            () => {
              clearTimeout(timeoutId);
              reject(new Error("WAIT_ABORTED"));
            },
            { once: true },
          );
        }
      });

      return {
        status: "success",
        schema: {
          status: "The wait status (success, aborted)",
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message === "WAIT_ABORTED") {
        return {
          status: "aborted",
          schema: {
            status: "The wait status (success, aborted)",
          },
        };
      }
    }
  },
});
