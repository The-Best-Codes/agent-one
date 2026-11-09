import { isAbsolute } from "@tauri-apps/api/path";
import { exists, readTextFile } from "@tauri-apps/plugin-fs";
import { generateId } from "ai";
import { atom, getDefaultStore } from "jotai";

import { resolvePath } from "@/lib/ai/tools/utils/path";
import { globalAgentsFilesAtom } from "@/lib/jotai/unsynced-local-atoms";
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
  details: Pick<
    Project,
    "name" | "instructions" | "folder" | "separateMemory" | "agentsFiles" | "skillsFolders"
  >,
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

export interface ChatAccessScope {
  projectId?: string;
  hiddenProjectIds: string[];
}

export function getChatAccessScope(currentProject: Project | undefined): ChatAccessScope {
  if (currentProject?.separateMemory) {
    return { projectId: currentProject.id, hiddenProjectIds: [] };
  }
  const hiddenProjectIds = getDefaultStore()
    .get(projectsAtom)
    .filter((project) => project.separateMemory && project.id !== currentProject?.id)
    .map((project) => project.id);
  return { hiddenProjectIds };
}

export function canAccessChat(chatProjectId: string | undefined, scope: ChatAccessScope): boolean {
  if (scope.projectId) return chatProjectId === scope.projectId;
  return !chatProjectId || !scope.hiddenProjectIds.includes(chatProjectId);
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

async function readAgentsFile(path: string): Promise<string | undefined> {
  try {
    if (!(await exists(path))) return undefined;
    const content = (await readTextFile(path)).trim();
    if (!content) return undefined;
    return content.length > MAX_AGENTS_FILE_CHARS
      ? `${content.slice(0, MAX_AGENTS_FILE_CHARS)}\n[AGENTS.md was cut off because it is too long]`
      : content;
  } catch (error) {
    logger.warn(`Failed to read AGENTS.md at ${path}`, error);
    return undefined;
  }
}

export const PROJECT_FOLDER_AGENTS_FILE = "AGENTS.md";

export function getDefaultProjectAgentsFiles(globalFiles: string[], folder?: string): string[] {
  return folder ? [...globalFiles, PROJECT_FOLDER_AGENTS_FILE] : globalFiles;
}

function getAgentsFiles(project: Project | undefined): string[] {
  const globalFiles = getDefaultStore().get(globalAgentsFilesAtom);
  if (!project) return globalFiles;
  return project.agentsFiles ?? getDefaultProjectAgentsFiles(globalFiles, project.folder);
}

export async function getAgentsFilesPromptSection(project: Project | undefined): Promise<string> {
  const resolvedPaths = await Promise.all(
    getAgentsFiles(project).map((entry) => resolvePath(entry, project?.folder)),
  );
  const files = await Promise.all(
    [...new Set(resolvedPaths)].map(async (path) => ({
      path,
      content: (await isAbsolute(path)) ? await readAgentsFile(path) : undefined,
    })),
  );
  const loaded = files.filter((file) => file.content);
  if (loaded.length === 0) return "";
  const intro =
    loaded.length === 1
      ? "The user has an AGENTS.md file with instructions for you. Follow it."
      : "The user has AGENTS.md files with instructions for you. Follow them. Where they conflict, follow the later file.";
  return [
    `## AGENTS.md\n${intro}`,
    ...loaded.map((file) => `### \`${file.path}\`\n${file.content}`),
  ].join("\n\n");
}
