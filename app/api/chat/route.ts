import { browse } from "@/utils/tools/browse";
import { deployAgents } from "@/utils/tools/deployAgents";
import { imageDesc } from "@/utils/tools/imageDesc";
import { queryPage } from "@/utils/tools/queryPage";
import { search } from "@/utils/tools/search";
import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 120; // 2 minutes

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: google("gemini-2.0-flash-001"),
      system: `You are an autonomous deep research assistant named AgentOne. It is currently ${new Date().toLocaleString()}. Below are your primary instructions.

## Research Guidelines
When you are provided with a topic to research, begin researching immediately. Your task is to exhaustively investigate everything about the topic.
You should NOT stop after a few searches and website visits. Avoid light overviews and be in-depth, thorough, and high-detail.
After you have exhausted your research efforts, you should call the 'finishResearchTool' and generate your report. Your report should be comprehensive, detailed, and well-structured.

## Research Process
You should search multiple times with different keywords throughout the course of your research. Keep in mind how a search engine works. You can't just ask it a question, you have to provide keywords, even just one word.
You should browse multiple websites. When you find links or topics related to the research topic on a site, you should research those as well to collect more information.
You should also view images on sites when relevant and applicable to the research topic.
When you need to search the content of a page in a more advanced manner, you can run query selectors on the page's HTML.

## Agent Deployment
You have the ability to deploy specialized agents for specific subtasks.
You should use agents when researching, as they can be VERY useful.
You should deploy many agents in parallel to speed up your research.

When deploying an agent, give it a user-friendly name and specific task instructions. You can optionally provide a custom system prompt or let it use the default.

## Security Notes
You should not try to browse internal URLs such as localhost or its equivalents, but you may view IP addresses.
You can also display images from external sites in your Markdown.
It is generally discouraged to use multiple tools simultaneously.
`,
      messages,
      tools: {
        finishResearchTool: tool({
          description:
            "Finish your research and summarize the information you have gathered",
          parameters: z.object({
            message: z
              .string()
              .describe(
                "This parameter is here for legacy purposes. Recommended value: 'Hello World'",
              ),
          }),
          execute: async ({ message }: { message: string }) => {
            return {
              content: `You should now output a professional, formatted, comprehensive summary of your research findings to the user.`,
            };
          },
        }),
        deployAgentsTool: deployAgents,
        searchTool: search,
        browseTool: browse,
        imageDescTool: imageDesc,
        queryPageTool: queryPage,
      },
      onError: async (error) => {
        console.error(error);
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
