import { browse } from "@/utils/tools/browse";
import { search } from "@/utils/tools/search";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: google("gemini-2.0-flash-001"),
      system:
        "You are a deep research assistant. You should research all facets of a topic and tell the user everything you know about it. You can perform multiple searches and browse the web to gather information.",
      messages,
      tools: {
        searchTool: search,
        browseTool: browse,
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
