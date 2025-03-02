import { initializeDB } from "@/utils/memory";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { z } from "zod";

const HARDCODED_FILENAME = "db/agent_one_memory_db.json";
const HARDCODED_LOCK_FILENAME = "db/agent_one_memory_db.lock.json";

const ListSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().optional().default(10),
});

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

export async function GET(req: NextRequest) {
  try {
    await ensureDirectoryExistence(HARDCODED_FILENAME);
    await ensureDirectoryExistence(HARDCODED_LOCK_FILENAME);
    await initializeDB(HARDCODED_FILENAME, HARDCODED_LOCK_FILENAME);

    const url = new URL(req.url);
    const page = url.searchParams.get("page");
    const pageSize = url.searchParams.get("pageSize");

    const validatedParams = ListSchema.parse({
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });

    const { page: currentPage, pageSize: currentPageSize } = validatedParams;

    const data = await fs.readFile(HARDCODED_FILENAME, "utf-8");
    const allDocuments = JSON.parse(data);

    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = startIndex + currentPageSize;
    const paginatedDocuments = allDocuments.slice(startIndex, endIndex);

    const totalDocuments = allDocuments.length;
    const totalPages = Math.ceil(totalDocuments / currentPageSize);

    return NextResponse.json(
      {
        documents: paginatedDocuments,
        page: currentPage,
        pageSize: currentPageSize,
        totalDocuments: totalDocuments,
        totalPages: totalPages,
      },
      { status: 200 },
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input", errors: error.errors },
        { status: 400 },
      );
    }
    console.error("Error listing documents:", error);
    return NextResponse.json(
      { message: "Failed to list documents", error: error.message },
      { status: 500 },
    );
  }
}
