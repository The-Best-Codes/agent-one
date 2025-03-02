import { initializeDB, searchDB } from "@/utils/memory";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { z } from "zod";

const QuerySchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().positive().optional().default(3),
  returnEmbeddings: z.boolean().optional().default(false),
});

const HARDCODED_FILENAME = "db/agent_one_memory_db.json";
const HARDCODED_LOCK_FILENAME = "db/agent_one_memory_db.lock.json";

async function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  try {
    await fs.access(dirname);
  } catch (error: any) {
    try {
      await fs.mkdir(dirname, { recursive: true });
    } catch (error: any) {
      throw error; // Something else went wrong
    }
  }
}

async function handleQuery(req: NextRequest, method: string) {
  try {
    await ensureDirectoryExistence(HARDCODED_FILENAME); // Ensure directory exists
    await ensureDirectoryExistence(HARDCODED_LOCK_FILENAME); // Ensure directory exists
    await initializeDB(HARDCODED_FILENAME, HARDCODED_LOCK_FILENAME); // Ensure DB is initialized

    let body;
    if (method === "POST") {
      body = await req.json();
    } else {
      const url = new URL(req.url);
      const query = url.searchParams.get("query");
      const topK = url.searchParams.get("topK");
      const returnEmbeddings = url.searchParams.get("returnEmbeddings");

      if (!query) {
        return NextResponse.json(
          { message: "Missing 'query' parameter in GET request" },
          { status: 400 },
        );
      }

      body = {
        query: query,
        topK: topK ? parseInt(topK) : undefined,
        returnEmbeddings: returnEmbeddings === "true", // convert to boolean
      };
    }

    const validatedBody = QuerySchema.parse(body);

    // Load from hardcoded filename - no longer needed as initialized once
    //await loadDB();

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

export async function POST(req: NextRequest) {
  return handleQuery(req, "POST");
}

export async function GET(req: NextRequest) {
  return handleQuery(req, "GET");
}
