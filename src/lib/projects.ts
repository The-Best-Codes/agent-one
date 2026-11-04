import { join } from "@tauri-apps/api/path";
import { exists, readTextFile } from "@tauri-apps/plugin-fs";
import { generateId } from "ai";
import { atom, getDefaultStore } from "jotai";

import { getLogger } from "@/lib/logger";
import { type Project, projectStorage } from "@/lib/storage/project-storage";

export type { Project };

const logger = getLogger(import.meta.url);

const MAX_AGENTS_FILE_CHARS = 20000;

export const projectsAtom = atom<Project[]>([]);

export const projectsLoadedAtom = atom(false);

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort(
    (a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.id.localeCompare(b.id),
  );
}

function persistProject(project: Project) {
  void projectStorage.saveProject(project).catch((error) => {
    logger.error(`Failed to save project ${project.id}`, error);
  });
}

export async function loadProjects(): Promise<void> {
  const store = getDefaultStore();
  try {
    store.set(projectsAtom, sortProjects(await projectStorage.listProjects()));
  } catch (error) {
    logger.error("Failed to load projects", error);
  }
  store.set(projectsLoadedAtom, true);
}

export function getProject(id: string | undefined): Project | undefined {
  if (!id) return undefined;
  return getDefaultStore()
    .get(projectsAtom)
    .find((project) => project.id === id);
}

export function createProject(
  details: Pick<Project, "name" | "instructions" | "folder" | "separateMemory">,
): Project {
  const now = Date.now();
  const project: Project = {
    ...details,
    id: generateId(),
    memory: [],
    createdAt: now,
    updatedAt: now,
  };
  getDefaultStore().set(projectsAtom, (prev) => sortProjects([...prev, project]));
  persistProject(project);
  return project;
}

export function updateProject(
  id: string,
  changes: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>,
): Project | undefined {
  const current = getProject(id);
  if (!current) return undefined;
  const project: Project = { ...current, ...changes, updatedAt: Date.now() };
  getDefaultStore().set(projectsAtom, (prev) =>
    sortProjects(prev.map((entry) => (entry.id === id ? project : entry))),
  );
  persistProject(project);
  return project;
}

export function deleteProject(id: string) {
  getDefaultStore().set(projectsAtom, (prev) => prev.filter((project) => project.id !== id));
  void projectStorage.deleteProject(id).catch((error) => {
    logger.error(`Failed to delete project ${id}`, error);
  });
}

export function canAccessChat(
  chatProjectId: string | undefined,
  currentProject: Project | undefined,
): boolean {
  if (currentProject?.separateMemory) return chatProjectId === currentProject.id;
  if (!chatProjectId || chatProjectId === currentProject?.id) return true;
  return !getProject(chatProjectId)?.separateMemory;
}

export function getProjectPromptSection(project: Project): string {
  const sections = [
    `## Project\nThis chat is part of the user's project "${project.name}". A project groups related chats and gives them shared instructions.`,
  ];
  const instructions = project.instructions.trim();
  if (instructions) {
    sections.push(`### Project instructions\n${instructions}`);
  }
  if (project.folder) {
    sections.push(
      `### Project folder\nThe project's folder is \`${project.folder}\`. Shell commands run in this folder, and relative file paths are resolved from it.`,
    );
  }
  if (project.separateMemory) {
    sections.push(
      "### Project memory\nThis project keeps its own memory, separate from the user's other chats. The memory tool reads and writes this project's memory, and the chat history tools only see chats in this project.",
    );
  }
  return sections.join("\n");
}

export async function readProjectAgentsFile(project: Project): Promise<string | undefined> {
  if (!project.folder) return undefined;
  try {
    const path = await join(project.folder, "AGENTS.md");
    if (!(await exists(path))) return undefined;
    const content = (await readTextFile(path)).trim();
    if (!content) return undefined;
    return content.length > MAX_AGENTS_FILE_CHARS
      ? `${content.slice(0, MAX_AGENTS_FILE_CHARS)}\n[AGENTS.md was cut off because it is too long]`
      : content;
  } catch (error) {
    logger.warn(`Failed to read AGENTS.md for project ${project.id}`, error);
    return undefined;
  }
}
