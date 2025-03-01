"use server";
import { pipeline } from "@huggingface/transformers";
import * as fs from "fs/promises";

// Define an interface for our document objects
interface Document {
  text: string;
  embedding: number[];
}

class VectorDB {
  private documents: Document[] = [];
  private extractor: any;

  constructor() {}

  async init() {
    // Initialize the feature-extraction pipeline
    this.extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
  }

  async addDocument(text: string): Promise<void> {
    const output = await this.extractor(text, {
      pooling: "mean",
      normalize: true,
    });
    const embedding = output.tolist()[0] as number[];
    this.documents.push({ text, embedding });
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
    } catch (error) {
      console.warn(`Error loading database from ${filename}: ${error}`);
      this.documents = []; // Start with an empty database
    }
  }
}

// Singleton instance of the VectorDB
let vectorDBInstance: VectorDB | null = null;

// Initialize the database (must be called before using other functions)
export async function initializeDB(): Promise<void> {
  if (!vectorDBInstance) {
    vectorDBInstance = new VectorDB();
    await vectorDBInstance.init();
  }
}

// Function to add text to the database
export async function addTextToDB(text: string): Promise<void> {
  if (!vectorDBInstance) {
    throw new Error("VectorDB not initialized. Call initializeDB() first.");
  }
  await vectorDBInstance.addDocument(text);
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
export async function saveDB(filename: string): Promise<void> {
  if (!vectorDBInstance) {
    throw new Error("VectorDB not initialized. Call initializeDB() first.");
  }
  await vectorDBInstance.save(filename);
}

// Function to load the database from a file
export async function loadDB(filename: string): Promise<void> {
  if (!vectorDBInstance) {
    vectorDBInstance = new VectorDB(); // Create instance if it doesn't exist
    await vectorDBInstance.init(); // and initialize it.
  }
  await vectorDBInstance.load(filename);
}
