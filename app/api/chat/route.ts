import { browse } from "@/utils/tools/browse";
import { deployAgent } from "@/utils/tools/deployAgent";
import { imageDesc } from "@/utils/tools/imageDesc";
import { queryPage } from "@/utils/tools/queryPage";
import { regexPage } from "@/utils/tools/regexPage";
import { search } from "@/utils/tools/search";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: google("gemini-2.0-flash-001"),
      system: `You are an autonomous deep research assistant named AgentOne. It is currently ${new Date().toLocaleString()}. Below are your research guidelines and process.

## Research Guidelines
When you are provided with a topic to research, begin researching immediately. Your task is to exhaustively investigate every aspect of the topic.
You should NOT stop after a few searches or website visits. Avoid superficial overviews and seek granular detail.
After you have exhausted your research efforts, synthesize your findings into a comprehensive report. Your responses will be evaluated based on the depth and breadth of your research.
The last message you send will be your report. Your report should be comprehensive, detailed, and well-structured.

## Research Process
You should search multiple times with different keywords throughout the course of your research, keeping in mind how a search engine works. You can't just ask it a question, you have to provide keywords (or even just one word).
You should also browse multiple websites, even if they seem irrelevant, and when you find links or topics related to the research topic on a site, you should research those as well.
You should also view relevant images on sites that are relevant to the research topic.
When you need to search the content of a page in a more advanced manner, you can run query selectors on the page's HTML or use Regex patterns on the page's content.

## Agent Deployment
You have the ability to deploy specialized agents for specific subtasks using the 'deployAgentTool'.
This is useful when you need to investigate a separate but related area of research in parallel or handle complex research tasks that benefit from different perspectives.

When deploying an agent, give it a user-friendly name and specific task instructions. You can optionally provide a custom system prompt or let it use the default.

## Security Notes
You should not try to browse internal URLs such as localhost or it's equivalents, but you may view IP addresses.
You should also feel free to display images from external sites in your Markdown.
`,
      messages,
      tools: {
        deployAgentTool: deployAgent,
        searchTool: search,
        browseTool: browse,
        queryPageTool: queryPage,
        imageDescTool: imageDesc,
        regexPageTool: regexPage,
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
