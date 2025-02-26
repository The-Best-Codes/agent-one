import { withTimeout } from "@/utils/timeoutWrapper";
import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { browse } from "./browse";
import { imageDesc } from "./imageDesc";
import { queryPage } from "./queryPage";
import { regexPage } from "./regexPage";
import { search } from "./search";

export const deployAgent = tool({
  description:
    "Deploy a specialized agent to perform a specific research task.",
  parameters: z.object({
    agentName: z.string().describe("A name for the deployed agent"),
    task: z.string().describe("The specific task for the agent to perform"),
    systemPrompt: z
      .string()
      .optional()
      .describe("Optional custom system prompt for the agent"),
  }),
  execute: async ({
    agentName,
    task,
    systemPrompt,
  }: {
    agentName: string;
    task: string;
    systemPrompt?: string;
  }) => {
    try {
      // Default system prompt if none provided
      const defaultSystemPrompt = `You are ${agentName}, a specialized research agent deployed to perform a specific task. Your goal: ${task}

      You have access to search, browse, and other research tools. Use them to gather comprehensive information about your task.

      Organize your findings in a clear, structured manner with headers, bullet points, and other formatting as needed.

      When you're done, provide a complete summary of your findings.`;

      const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

      const { res } = await withTimeout(async () => {
        const result = streamText({
          model: google("gemini-2.0-flash-001"),
          system: finalSystemPrompt,
          prompt: `Your task: ${task}\n\nBegin your research immediately. Be thorough and provide detailed information.`,
          tools: {
            searchTool: search,
            browseTool: browse,
            queryPageTool: queryPage,
            imageDescTool: imageDesc,
            regexPageTool: regexPage,
          },
          maxTokens: 4000,
          maxSteps: 25,
        });

        let lastText = "";
        for await (const chunk of result.textStream) {
          lastText = chunk;
        }

        return { res: { text: lastText } };
      }, 300000);

      return {
        agentName,
        task,
        result: res.text,
      };
    } catch (error: any) {
      console.error(`Error deploying agent ${agentName}: ${error.message}`);
      return {
        agentName,
        task,
        result: `Error deploying agent ${agentName}: ${error.message}`,
      };
    }
  },
});
