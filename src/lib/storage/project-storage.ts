import { enqueueWrite, getDb } from "@/lib/storage/chat-storage";

export interface Project {
  id: string;
  name: string;
  instructions: string;
  folder?: string;
  separateMemory: boolean;
  memory: string[];
  agentsFiles?: string[];
  createdAt: number;
  updatedAt: number;
}

interface ProjectRow {
  id: string;
  name: string;
  instructions: string;
  folder: string | null;
  separate_memory: number;
  memory: string;
  agents_files: string | null;
  created_at: number;
  updated_at: number;
}

function parseStringList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

export const projectStorage = {
  async listProjects(): Promise<Project[]> {
    const d = await getDb();
    const rows = await d.select<ProjectRow[]>(
      `SELECT id, name, instructions, folder, separate_memory, memory, agents_files, created_at, updated_at
       FROM projects
       ORDER BY name COLLATE NOCASE, id`,
      [],
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      instructions: row.instructions,
      folder: row.folder ?? undefined,
      separateMemory: row.separate_memory === 1,
      memory: parseStringList(row.memory),
      agentsFiles: row.agents_files === null ? undefined : parseStringList(row.agents_files),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async saveProject(project: Project): Promise<void> {
    await enqueueWrite((d) =>
      d.execute(
        `INSERT INTO projects (id, name, instructions, folder, separate_memory, memory, created_at, updated_at, agents_files)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT(id) DO UPDATE SET
           name = $2,
           instructions = $3,
           folder = $4,
           separate_memory = $5,
           memory = $6,
           updated_at = $8,
           agents_files = $9`,
        [
          project.id,
          project.name,
          project.instructions,
          project.folder ?? null,
          project.separateMemory ? 1 : 0,
          JSON.stringify(project.memory),
          project.createdAt,
          project.updatedAt,
          project.agentsFiles ? JSON.stringify(project.agentsFiles) : null,
        ],
      ),
    );
  },

  async deleteProject(id: string): Promise<void> {
    await enqueueWrite(async (d) => {
      await d.execute("UPDATE chat_metadata SET project_id = NULL WHERE project_id = $1", [id]);
      await d.execute("DELETE FROM projects WHERE id = $1", [id]);
    });
  },
};
