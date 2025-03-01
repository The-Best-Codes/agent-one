import { withTimeout } from "@/utils/timeoutWrapper";
import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { browse } from "./browse";
import { imageDesc } from "./imageDesc";
import { search } from "./search";

const agentSchema = z.object({
  agentName: z
    .string()
    .describe(
      "A natural name for the deployed agent, for example 'Historical Context Researcher'. Choose an informative, short title that users will understand.",
    ),
  task: z.string().describe("The specific task for the agent to perform"),
  systemPrompt: z
    .string()
    .optional()
    .describe("Optional custom system prompt for the agent"),
});

export const deployAgents = tool({
  description:
    "Deploy multiple specialized agents to perform research tasks in parallel.",
  parameters: z.object({
    agents: z
      .array(agentSchema)
      .min(1)
      .max(5)
      .describe("An array of agent configurations to deploy."),
  }),
  execute: async ({ agents }: { agents: z.infer<typeof agentSchema>[] }) => {
    const agentResults = await Promise.all(
      agents.map(async (agent) => {
        const { agentName, task, systemPrompt } = agent;
        try {
          // Default system prompt if none provided
          const defaultSystemPrompt = `You are ${agentName}, a specialized research agent deployed to perform a specific task.

You should NEVER decline to perform your task or say you are unable to. You can ALWAYS find a way to complete it with or without using the tools you have.
You are ALWAYS able to complete your task, even if it seems impossible. Be creative and resourceful!

You have access to search, browse, and image description tools. Use them to gather comprehensive information about your task, even if the instructions don't explicitly mention using them.
Organize your findings in a clear, structured manner with headers, bullet points, and other formatting as needed. Be verbose and detailed.
When you're done, provide a complete summary of your findings.`;

          const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

          const { res } = await withTimeout(async () => {
            let finalResult: any = "";

            const resStream = streamText({
              model: google("gemini-2.0-flash-lite"),
              temperature: 0.7,
              system: finalSystemPrompt,
              prompt: `Your task: ${task}\n\nBegin your research immediately. Be thorough and provide detailed information.`,
              tools: {
                searchTool: search,
                browseTool: browse,
                imageDescTool: imageDesc,
              },
              maxSteps: 20,
              onStepFinish: (completion) => {
                finalResult = structuredClone(completion);
              },
            });

            for await (const chunk of resStream.textStream) {
              // No-op, we just have to do this so that the stream can be processed
            }

            return { res: { text: finalResult } };
          }, 300000);

          return {
            agentName,
            task,
            result: res.text.text,
          };
        } catch (error: any) {
          console.error(`Error deploying agent ${agentName}: ${error.message}`);
          return {
            agentName,
            task,
            result: `Error deploying agent ${agentName}: ${error.message}`,
          };
        }
      }),
    );

    return { agents: agentResults };
  },
});
