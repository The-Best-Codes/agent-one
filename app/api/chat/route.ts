import { saveChat } from "@/lib/chat-store";
import { defaultPrompt } from "@/lib/main-agent-prompt";
import { imageDesc } from "@/utils/tools/imageDesc";
import { memory } from "@/utils/tools/memory";
import { queryPage } from "@/utils/tools/queryPage";
import { readSite } from "@/utils/tools/readSite";
import { renderChart } from "@/utils/tools/renderChart";
import { webSearch } from "@/utils/tools/webSearch";
import { google } from "@ai-sdk/google";
import { appendResponseMessages, streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 120; // 2 minutes

export async function POST(req: Request) {
  try {
    const { messages, id } = await req.json();

    const result = streamText({
      model: google("gemini-2.0-flash-exp"),
      system: defaultPrompt,
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
          execute: async ({}: { message: string }) => {
            return {
              content: `You should now output a professional, formatted, comprehensive summary of your research findings to the user.`,
            };
          },
        }),
        webSearchTool: webSearch,
        readSiteTool: readSite,
        memoryTool: memory,
        imageDescTool: imageDesc,
        queryPageTool: queryPage,
        renderChartTool: renderChart,
      },
      async onFinish({ response }) {
        if (id) {
          await saveChat({
            id,
            messages: appendResponseMessages({
              messages,
              responseMessages: response.messages,
            }),
          });
        }
      },
      onError: async (error) => {
        console.error(error);
      },
    });

    result.consumeStream(); // Consume the stream so onFinish gets called

    return result.toDataStreamResponse();
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
