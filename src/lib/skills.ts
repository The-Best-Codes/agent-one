import { isAbsolute, join } from "@tauri-apps/api/path";
import { exists, readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { getDefaultStore } from "jotai";
import { VFile } from "vfile";
import { matter } from "vfile-matter";

import { resolvePath } from "@/lib/ai/tools/utils/path";
import { globalSkillsFoldersAtom } from "@/lib/jotai/unsynced-local-atoms";
import { getLogger } from "@/lib/logger";
import type { Project } from "@/lib/storage/project-storage";

const logger = getLogger(import.meta.url);

export const PROJECT_FOLDER_SKILLS_FOLDERS = [".agents/skills", ".claude/skills"];

export interface Skill {
  name: string;
  description: string;
  folder: string;
  file: string;
}

export function getDefaultProjectSkillsFolders(globalFolders: string[], folder?: string): string[] {
  return folder ? [...globalFolders, ...PROJECT_FOLDER_SKILLS_FOLDERS] : globalFolders;
}

function getSkillsFolders(project: Project | undefined): string[] {
  const globalFolders = getDefaultStore().get(globalSkillsFoldersAtom);
  if (!project) return globalFolders;
  return project.skillsFolders ?? getDefaultProjectSkillsFolders(globalFolders, project.folder);
}

async function readSkill(folder: string, folderName: string): Promise<Skill | undefined> {
  const file = await join(folder, "SKILL.md");
  if (!(await exists(file))) return undefined;
  const vfile = new VFile(await readTextFile(file));
  try {
    matter(vfile);
  } catch (error) {
    logger.warn(`Failed to read the frontmatter of ${file}`, error);
  }
  const { name, description } = (vfile.data.matter ?? {}) as Record<string, unknown>;
  return {
    name: typeof name === "string" && name.trim() ? name.trim() : folderName,
    description: typeof description === "string" ? description.trim() : "",
    folder,
    file,
  };
}

async function findSkillsInFolder(entry: string, projectFolder?: string): Promise<Skill[]> {
  const root = await resolvePath(entry, projectFolder);
  if (!(await isAbsolute(root)) || !(await exists(root))) return [];
  const entries = await readDir(root);
  const skills = await Promise.all(
    entries
      .filter((entry) => (entry.isDirectory || entry.isSymlink) && !entry.name.startsWith("."))
      .map(async (entry) => {
        try {
          return await readSkill(await join(root, entry.name), entry.name);
        } catch (error) {
          logger.warn(`Failed to read skill ${entry.name} in ${root}`, error);
          return undefined;
        }
      }),
  );
  return skills.filter((skill) => skill !== undefined);
}

export async function loadSkills(project: Project | undefined): Promise<Skill[]> {
  const folders = await Promise.all(
    getSkillsFolders(project).map((entry) =>
      findSkillsInFolder(entry, project?.folder).catch((error: unknown) => {
        logger.warn(`Failed to look for skills in ${entry}`, error);
        return [];
      }),
    ),
  );
  const skills = new Map<string, Skill>();
  for (const skill of folders.flat()) skills.set(skill.name, skill);
  return [...skills.values()].sort((a, b) => a.name.localeCompare(b.name));
}
