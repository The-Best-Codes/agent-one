import { tool } from "ai";
import { z } from "zod";

import { loadSkills } from "@/lib/skills";
import type { Project } from "@/lib/storage/project-storage";

export const createUseSkillTool = (project: Project | undefined) =>
  tool({
    description:
      "List the skills you can use. A skill is a folder of instructions and files for a specific kind of task, like working with a file type, a tool, or a workflow. Call this when a task might match a skill, then read the relevant skill's instructions before you start.",
    inputSchema: z.object({}),
    execute: async () => {
      const skills = await loadSkills(project);
      if (skills.length === 0) {
        return { skills, instructions: "No skills are available." };
      }
      return {
        skills,
        instructions:
          "If one of these skills fits the task, use the viewFile tool to read its SKILL.md file and follow it. The file may point to other files in the skill's folder; paths in it are relative to that folder, so read those with viewFile too when they're relevant. Don't read skills that don't fit the task.",
      };
    },
  });
