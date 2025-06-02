import { tool } from "ai";
import ivm from "isolated-vm";
import { z } from "zod";

const RunJsToolParametersSchema = z
  .object({
    code: z
      .string()
      .describe("The JavaScript code to execute within the sandbox."),
  })
  .describe("Parameters object for the runJs tool.");

export const runJs = tool({
  description:
    "Executes arbitrary JavaScript code in a secure sandbox using V8 isolates.",
  parameters: RunJsToolParametersSchema,
  execute: async ({
    code,
  }: {
    code: z.infer<typeof RunJsToolParametersSchema>["code"];
  }) => {
    let result: any;
    let error: string | undefined;
    let isolate: ivm.Isolate | undefined;

    try {
      isolate = new ivm.Isolate({
        memoryLimit: 128,
      });

      const context = await isolate.createContext();

      const jail = context.global;

      //jail.setSync("console", new ivm.Reference(console));

      const script = await isolate.compileScript(code, {
        filename: "sandbox.js",
      });

      result = await script.run(context, {
        timeout: 1000,
        copy: true,
      });
    } catch (e: any) {
      error = `Error executing JavaScript: ${e.message}`;
      console.error("Error in runJsTool execution:", e);
    } finally {
      if (isolate) {
        isolate.dispose();
      }
    }

    if (error) {
      return { status: "Execution failed", error };
    } else {
      let resultString;
      try {
        resultString = JSON.stringify(result);
      } catch (jsonError: any) {
        resultString = `Execution succeeded, but result could not be serialized: ${jsonError.message}. Result type: ${typeof result}`;
      }
      return { status: "Execution successful", result: resultString };
    }
  },
});
