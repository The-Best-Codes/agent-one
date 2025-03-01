import { addTextToDB, initializeDB, saveDB } from "@/utils/memory";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { z } from "zod";

const SaveSchema = z.object({
  text: z.string().min(1),
});

const HARDCODED_FILENAME = "db/agent_one_memory_db.json";

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

async function handleSave(req: NextRequest, method: string) {
  try {
    await ensureDirectoryExistence(HARDCODED_FILENAME); // Ensure directory exists
    await initializeDB(); // Ensure DB is initialized

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
      body = { text }; // Create a body object for GET requests
    }

    const validatedBody = SaveSchema.parse(body);

    await addTextToDB(validatedBody.text);

    await saveDB(HARDCODED_FILENAME); // Use the hardcoded filename

    return NextResponse.json(
      { message: "Text saved successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input", errors: error.errors },
        { status: 400 },
      );
    }
    console.error("Error saving text:", error);
    return NextResponse.json(
      { message: "Failed to save text", error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return handleSave(req, "POST");
}

export async function GET(req: NextRequest) {
  return handleSave(req, "GET");
}
