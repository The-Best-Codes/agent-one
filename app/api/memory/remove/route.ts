import { initializeDB, removeTextFromDB } from "@/utils/memory";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { z } from "zod";

const RemoveSchema = z.object({
  text: z.string().min(1),
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

async function handleRemove(req: NextRequest, method: string) {
  try {
    await ensureDirectoryExistence(HARDCODED_FILENAME);
    await ensureDirectoryExistence(HARDCODED_LOCK_FILENAME);
    await initializeDB(HARDCODED_FILENAME, HARDCODED_LOCK_FILENAME);

    let body;
    if (method === "POST") {
      body = await req.json();
    } else {
      const url = new URL(req.url);
      const text = url.searchParams.get("text");
      if (!text) {
        return NextResponse.json(
          { message: "Missing 'text' parameter in GET request" },
          { status: 400 },
        );
      }
      body = { text };
    }

    const validatedBody = RemoveSchema.parse(body);

    await removeTextFromDB(validatedBody.text);

    return NextResponse.json(
      { message: "Text removed successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input", errors: error.errors },
        { status: 400 },
      );
    }
    console.error("Error removing text:", error);
    return NextResponse.json(
      { message: "Failed to remove text", error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return handleRemove(req, "POST");
}

export async function GET(req: NextRequest) {
  return handleRemove(req, "GET");
}
