import { initializeDB, loadDB, searchDB } from "@/utils/memory";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().positive().optional().default(3),
  returnEmbeddings: z.boolean().optional().default(false),
});

const HARDCODED_FILENAME = "agentone_memory_db";

export async function POST(req: NextRequest) {
  try {
    await initializeDB(); // Ensure DB is initialized
    const body = await req.json();
    const validatedBody = QuerySchema.parse(body);

    await loadDB(HARDCODED_FILENAME); // Load from hardcoded filename

    const results = await searchDB(validatedBody.query, validatedBody.topK);

    let responseResults: any[] = results;

    if (!validatedBody.returnEmbeddings) {
      responseResults = results.map((result) => {
        const { embedding, ...rest } = result;
        return rest;
      });
    }

    return NextResponse.json({ results: responseResults }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input", errors: error.errors },
        { status: 400 },
      );
    }
    console.error("Error querying database:", error);
    return NextResponse.json(
      { message: "Failed to query database", error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { message: "Use POST method to query." },
    { status: 405 },
  );
}
