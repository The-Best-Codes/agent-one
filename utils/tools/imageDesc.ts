import { describeImage } from "@/utils/tools/imageDescTool/index";
import { tool } from "ai";
import { z } from "zod";

export const imageDesc = tool({
  description: "Get the description of an image from its URL.",
  parameters: z.object({
    url: z
      .string()
      .describe(
        "The URL of the image including the protocol (e.g., https://), or a data image.",
      ),
  }),
  execute: async ({ url }: { url: string }) => {
    try {
      const description = await describeImage(url);

      return {
        description,
      };
    } catch (error: any) {
      console.error(`Error browsing ${url}: ${error.message}`);
      return {
        description: `Error browsing ${url}: ${error.message}`,
      };
    }
  },
});
