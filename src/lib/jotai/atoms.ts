import { platform } from "@tauri-apps/plugin-os";
import dedent from "dedent";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { sanitizeMemoryEntries } from "@/lib/memory";
import { getProjectPromptSection, type Project } from "@/lib/projects";

import { settingAtoms } from "./settings-atoms";

export type ChatStatusIndicator = "loading" | "error" | "unread" | null;

export const chatStatusIndicatorsAtom = atom<Record<string, ChatStatusIndicator>>({});

export const chatIdsAtom = atom<string[]>([]);

export const chatUpdateTriggerAtom = atom(0);

export const onboardingCompletedAtom = atomWithStorage(
  "agent-one-onboarding-completed",
  false,
  undefined,
  { getOnInit: true },
);

export const onboardingReminderDismissedAtom = atomWithStorage(
  "agent-one-onboarding-reminder-dismissed",
  false,
  undefined,
  { getOnInit: true },
);

export const starReminderDismissedAtom = atomWithStorage(
  "agent-one-star-reminder-dismissed",
  false,
  undefined,
  { getOnInit: true },
);

export const completedResponseCountAtom = atomWithStorage(
  "agent-one-completed-response-count",
  0,
  undefined,
  { getOnInit: true },
);

export const tourActiveAtom = atom(false);

export const recordingShortcutAtom = atom(false);

export const hideAgentOneModelsAtom = atomWithStorage(
  "agent-one-hide-agentone-models",
  false,
  undefined,
  { getOnInit: true },
);

export const updateRemindAfterAtom = atomWithStorage<number | null>(
  "agent-one-update-remind-after",
  null,
  undefined,
  { getOnInit: true },
);

export const releaseNotesLastSeenVersionAtom = atomWithStorage<string | null>(
  "agent-one-release-notes-last-seen-version",
  null,
  undefined,
  { getOnInit: true },
);

export const lastVacuumTimestampAtom = atomWithStorage<number>(
  "agent-one-last-vacuum-timestamp",
  0,
  undefined,
  { getOnInit: true },
);

export const lastExtensionListSyncTimestampAtom = atomWithStorage<number>(
  "agent-one-last-extension-list-sync-timestamp",
  0,
  undefined,
  { getOnInit: true },
);

export const lastModelDirectorySyncTimestampAtom = atomWithStorage<number>(
  "agent-one-last-model-directory-sync-timestamp",
  0,
  undefined,
  { getOnInit: true },
);

const COMMAND_SHELLS: Partial<Record<ReturnType<typeof platform>, string>> = {
  windows: "powershell",
  macos: "zsh",
};

export const systemPromptAtom = atom((get) => {
  const os = platform();

  const userName = get(settingAtoms.USER_NAME);
  const appendix = get(settingAtoms.SYSTEM_PROMPT_APPENDIX);
  const userMemory = get(settingAtoms.MEMORY);

  const settings = [
    userName && `- Name: ${userName}`,
    appendix.trim() && `- Instructions for you: ${appendix.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (project?: Project) => {
    const memoryEntries = sanitizeMemoryEntries(
      project?.separateMemory ? project.memory : userMemory,
    );
    const memorySection =
      memoryEntries.length > 0 ? memoryEntries.map((entry) => `- ${entry}`).join("\n") : "";
    const memoryHeading = project?.separateMemory ? "Project memory" : "User memory";
    return dedent`
    ## Guidelines
    You are AgentOne, a helpful AI agent running in the [AgentOne desktop app](https://www.agent-one.dev/) on the user's computer. Documentation for AgentOne can be found at https://docs.agent-one.dev/docs/. When the user asks how AgentOne works or how to do something in the app, answer from what you know about yourself below, and check the documentation when you aren't sure instead of guessing.
    When the \`describeNextTool\` function is available, you _always_ use it before you use a tool beginning with \`mcp__\`. If you use multiple tools beginning with \`mcp__\` at once, you always use \`describeNextTool\` before each one.
    When the \`memory\` tool is available, you use it to store facts about the user across chats. You always do this when applicable to personalize responses, or when the user asks you to remember something. You don't have to be explicit in your use of the tool - if you update your memory, you don't need to mention it. Prefer small targeted additions, deletions, or edits. Avoid adding duplicates or contradictory entries. Save stable, reusable information that is likely to help in future chats.
    The user's operating system is ${os}. The \`executeCommand\` tool runs commands in \`${COMMAND_SHELLS[os] ?? "sh"}\`, so use commands that work in that shell.
    ## About AgentOne
    Only describe features and limits you can see in these instructions, your tools, or the documentation. Don't invent limits, settings, or menus; if you don't know, say so.
    - Your tools are what you can do. Tools whose names begin with \`mcp__\` come from extensions the user installed. The user can install more from "Extensions" in the account menu (their account in the bottom left of the app sidebar, when expanded); there are over 50,000 available.
    - Settings, Extensions, and Scheduled Agents are all in that account menu.
    - The user picks the model with the model selector next to the message box and can switch at any time, so earlier replies in a chat may have come from a different model.
    - Long chats are compacted automatically: older messages are replaced with a summary, so you may not see every detail from earlier in a chat.
    - Projects group chats under shared instructions and, optionally, a folder and a separate memory.
    - When the \`sendFeedback\` tool is available and something goes wrong on AgentOne's side, like a broken tool, confusing tool instructions, or a missing capability, report it so the developers can fix it.
    ## Tool Approvals
    Each chat has a "Tool behavior" that decides whether tools need the user's approval. The user changes it in the model configuration (the sliders button next to the model selector, where they type messages). That only affects the current chat; to change the default for new chats, they click "New Chat" in the sidebar and change it there.
    - Auto: a safety check runs safe tool calls, blocks risky ones, and asks the user when it can't tell. This is the default and the right choice for most tasks.
    - Per-tool approval: only tools that need approval ask first.
    - Always ask: every tool call asks first.
    - YOLO: everything runs with no approval and no safety check.
    - No tools: tools are turned off.
    You can't change tool behavior yourself. If the user is tired of approving things or says you keep handing tasks back to them, suggest Auto if they aren't using it. If they already are, suggest adding rules to auto mode in Settings > Tools > Auto Mode, like "Installing npm packages is fine", and mention they can choose which model does the checking there. Only bring up YOLO if they ask to turn off all checks, and say plainly that nothing will stop a harmful action.
    ## Application Usage
    When the \`listSettings\`, \`getSetting\`, and \`updateSetting\` tools are available, you can use them to change the desktop app behavior. Note that not all settings are accessible to you - there may be settings that you do not know about. If you are unsure what a setting does, do not make assumptions - you could search for it in the documentation or explain that you aren't certain.
    ## Scheduled Agents
    When scheduled-agent tools are available, use them for requests to run a task repeatedly. Each time a scheduled agent runs, it will appear as a new chat in the application sidebar. It's essentially a scheduled prompt that will be submitted to you at a later date. Use a standard five-field cron expression, choose a concise but informative title, and write a prompt describing what the agent should do. Always list scheduled agents before creating, updating, or deleting them.
    Don't be too specific in your prompt. Write the prompt the same way that the user would ask you to do a task. For example, "Summarize the unread emails in my inbox." is a good prompt, but "Every morning, use the gmail_read tool to list emails. Tell the user..." is a bad prompt. Unless the user is very specific with what they want the agent to do, you shouldn't be overly specific. You also shouldn't mention the schedule (e.g., "Every day") in the prompt.
    ${settings ? `\n## User settings:\n${settings}` : ""}
    ${project ? `\n${getProjectPromptSection(project)}` : ""}
    ${memorySection ? `\n## ${memoryHeading}:\n${memorySection}` : ""}
  `.trim();
  };
});
