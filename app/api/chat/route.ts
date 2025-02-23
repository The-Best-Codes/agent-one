import { browse } from "@/utils/tools/browse";
import { search } from "@/utils/tools/search";
import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.0-flash-001"),
    messages,
    tools: {
      searchTool: search,
      browseTool: browse,
    },
  });

  return result.toDataStreamResponse();
}
