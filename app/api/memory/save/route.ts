import { addTextToDB, initializeDB, saveDB } from "@/utils/memory";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SaveSchema = z.object({
  text: z.string().min(1),
});

const HARDCODED_FILENAME = "agentone_memory_db";

export async function POST(req: NextRequest) {
  try {
    await initializeDB(); // Ensure DB is initialized
    const body = await req.json();
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

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { message: "Use POST method to save text." },
    { status: 405 },
  );
}
