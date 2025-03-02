"use server";
import { pipeline } from "@huggingface/transformers";
import * as fs from "fs/promises";

// Define an interface for our document objects
interface Document {
  text: string;
  embedding: number[];
}

interface DBLockEntry {
  text: string;
  timestamp: number;
}

class VectorDB {
  private documents: Document[] = [];
  private extractor: any;
  public dbLockFilename: string;
  private dbLock: { [key: string]: DBLockEntry } = {}; // Keyed by text
  public dbFilename: string;

  constructor(dbFilename: string, dbLockFilename: string) {
    this.dbFilename = dbFilename;
    this.dbLockFilename = dbLockFilename;
  }

  async init() {
    // Initialize the feature-extraction pipeline
    this.extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
    await this.loadDBLock();
  }

  private async loadDBLock(): Promise<void> {
    try {
      const data = await fs.readFile(this.dbLockFilename, "utf-8");
      this.dbLock = JSON.parse(data);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File doesn't exist, create an empty one
        this.dbLock = {};
        await this.saveDBLock(); // Create the file
      } else {
        console.warn(
          `Error loading db lock from ${this.dbLockFilename}: ${error}`,
        );
        this.dbLock = {};
      }
    }
  }

  private async saveDBLock(): Promise<void> {
    const data = JSON.stringify(this.dbLock, null, 2); // Pretty print JSON
    await fs.writeFile(this.dbLockFilename, data, "utf-8");
  }

  async addDocument(text: string): Promise<void> {
    if (this.dbLock[text]) {
      console.warn(`Text already exists in DB Lock, skipping: ${text}`);
      return; // Skip if text already exists, it might be better to throw an error later
    }

    const output = await this.extractor(text, {
      pooling: "mean",
      normalize: true,
    });
    const embedding = output.tolist()[0] as number[];
    this.documents.push({ text, embedding });

    // Update DB Lock
    this.dbLock[text] = {
      text: text,
      timestamp: Date.now(),
    };
    await this.saveDBLock();
  }

  async removeDocument(text: string): Promise<void> {
    // Remove from documents array
    this.documents = this.documents.filter((doc) => doc.text !== text);

    // Remove from dbLock
    delete this.dbLock[text];
    await this.saveDBLock();
  }

  async search(query: string, topK: number = 3): Promise<Document[]> {
    const queryOutput = await this.extractor(query, {
      pooling: "mean",
      normalize: true,
    });
    const queryEmbedding = queryOutput.tolist()[0] as number[];

    // Calculate cosine similarity between query and document embeddings
    const similarities = this.documents.map((doc) => {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      return { doc, similarity };
    });

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Return top K results
    return similarities.slice(0, topK).map((item) => item.doc);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0; // Handle zero vectors
    }
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Persistence methods (optional)
  async save(filename: string): Promise<void> {
    const data = JSON.stringify(this.documents);
    await fs.writeFile(filename, data, "utf-8");
  }

  async load(filename: string): Promise<void> {
    try {
      const data = await fs.readFile(filename, "utf-8");
      this.documents = JSON.parse(data);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.log(`Database file not found: ${filename}. Starting empty.`);
        this.documents = [];
      } else {
        console.warn(`Error loading database from ${filename}: ${error}`);
        this.documents = []; // Start with an empty database
      }
    }
  }
}

// Singleton instance of the VectorDB
let vectorDBInstance: VectorDB | null = null;

// Initialize the database (must be called before using other functions)
export async function initializeDB(
  dbFilename: string,
  dbLockFilename: string,
): Promise<void> {
  if (!vectorDBInstance) {
    vectorDBInstance = new VectorDB(dbFilename, dbLockFilename);
    await vectorDBInstance.init();
    await vectorDBInstance.load(dbFilename); // Load the database after initialization
  }
}

// Function to add text to the database
export async function addTextToDB(text: string): Promise<void> {
  if (!vectorDBInstance) {
    throw new Error("VectorDB not initialized. Call initializeDB() first.");
  }
  await vectorDBInstance.addDocument(text);
  await vectorDBInstance.save(vectorDBInstance.dbFilename); // Persist after adding
}

// Function to remove text from the database
export async function removeTextFromDB(text: string): Promise<void> {
  if (!vectorDBInstance) {
    throw new Error("VectorDB not initialized. Call initializeDB() first.");
  }
  await vectorDBInstance.removeDocument(text);
  await vectorDBInstance.save(vectorDBInstance.dbFilename); // Persist after removal
}

// Function to search the database
export async function searchDB(
  query: string,
  topK: number = 3,
): Promise<Document[]> {
  if (!vectorDBInstance) {
    throw new Error("VectorDB not initialized. Call initializeDB() first.");
  }
  return await vectorDBInstance.search(query, topK);
}

// Function to save the database to a file
export async function saveDB(): Promise<void> {
  if (!vectorDBInstance) {
    throw new Error("VectorDB not initialized. Call initializeDB() first.");
  }
  if (vectorDBInstance.dbFilename) {
    await vectorDBInstance.save(vectorDBInstance.dbFilename);
  } else {
    throw new Error("DB Filename is undefined");
  }
}

// Function to load the database from a file
export async function loadDB(): Promise<void> {
  if (!vectorDBInstance) {
    throw new Error("VectorDB not initialized. Call initializeDB() first.");
  }
  if (vectorDBInstance.dbFilename) {
    await vectorDBInstance.load(vectorDBInstance.dbFilename);
  } else {
    throw new Error("DB Filename is undefined");
  }
}
