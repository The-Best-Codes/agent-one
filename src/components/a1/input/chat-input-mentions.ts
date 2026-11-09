import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  MatchDecorator,
  type Rect,
  tooltips,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import fuzzysort from "fuzzysort";

import {
  CHAT_MENTION_PATTERN,
  type ChatMention,
  formatChatMention,
  getChatMention,
  getMentionDisplay,
  MENTION_CHIP_CLASS,
  MENTION_ICON_CLASS,
} from "@/lib/chat-mentions";
import { getFileIconSvg, SKILL_ICON_SVG } from "@/lib/file-icons";
import { listProjectEntries, type ProjectEntry } from "@/lib/project-files";
import { loadSkills, type Skill } from "@/lib/skills";
import type { Project } from "@/lib/storage/project-storage";

const SKILLS_CACHE_TTL_MS = 30_000;
const MAX_RESULTS = 30;
const FILE_MATCH_THRESHOLD = 0.2;
const SKILL_MATCH_THRESHOLD = 0.5;

let skillsCache: { key: string; loadedAt: number; skills: Promise<Skill[]> } | undefined;

function getSkills(project: Project | undefined): Promise<Skill[]> {
  const key = project?.id ?? "";
  if (skillsCache?.key === key && Date.now() - skillsCache.loadedAt < SKILLS_CACHE_TTL_MS) {
    return skillsCache.skills;
  }
  const skills = loadSkills(project).catch(() => []);
  skillsCache = { key, loadedAt: Date.now(), skills };
  return skills;
}

class MentionWidget extends WidgetType {
  constructor(readonly mention: ChatMention) {
    super();
  }

  eq(other: MentionWidget) {
    return other.mention.kind === this.mention.kind && other.mention.value === this.mention.value;
  }

  toDOM() {
    const { label, title, iconSvg } = getMentionDisplay(this.mention);
    const chip = document.createElement("span");
    chip.className = `cm-chat-mention ${MENTION_CHIP_CLASS}`;
    chip.title = title;
    chip.dataset.mention = this.mention.kind;
    const icon = document.createElement("span");
    icon.className = MENTION_ICON_CLASS;
    icon.innerHTML = iconSvg;
    const text = document.createElement("span");
    text.className = "truncate";
    text.textContent = label;
    chip.append(icon, text);
    return chip;
  }
}

const mentionDecorator = new MatchDecorator({
  regexp: new RegExp(CHAT_MENTION_PATTERN),
  decoration: (match) => Decoration.replace({ widget: new MentionWidget(getChatMention(match)) }),
});

const mentionChipsPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = mentionDecorator.createDeco(view);
    }
    update(update: ViewUpdate) {
      this.decorations = mentionDecorator.updateDeco(update, this.decorations);
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => view.plugin(plugin)?.decorations ?? Decoration.none),
  },
);

const mentionChipsTheme = EditorView.theme({
  ".cm-chat-mention": {
    margin: "0 1px",
  },
});

export const chatMentionChips = [mentionChipsPlugin, mentionChipsTheme];

interface MentionCompletion extends Completion {
  mention: ChatMention;
  icon: string;
  matchIndexes: readonly number[];
}

function insertMention(view: EditorView, completion: Completion, from: number, to: number) {
  const text = `${formatChatMention((completion as MentionCompletion).mention)} `;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
    userEvent: "input.complete",
  });
}

function getParentPath(entry: ProjectEntry): string {
  const path = entry.path.replace(/\/$/, "");
  return path.slice(0, Math.max(0, path.length - entry.name.length - 1));
}

function getFileOptions(query: string, entries: ProjectEntry[]): MentionCompletion[] {
  return fuzzysort
    .go(query, entries, {
      keys: ["name", "path"],
      limit: MAX_RESULTS,
      threshold: FILE_MATCH_THRESHOLD,
      scoreFn: (result) => Math.max(result[0]?.score ?? 0, (result[1]?.score ?? 0) * 0.8),
    })
    .map((result) => {
      const label = result.obj.isDirectory ? `${result.obj.name}/` : result.obj.name;
      return {
        label,
        detail: getParentPath(result.obj),
        apply: insertMention,
        mention: { kind: "file", value: result.obj.path },
        icon: getFileIconSvg(label),
        matchIndexes: result[0]?.indexes ?? [],
      };
    });
}

function getSkillOptions(query: string, skills: Skill[]): MentionCompletion[] {
  return fuzzysort
    .go(query, skills, { key: "name", limit: MAX_RESULTS, threshold: SKILL_MATCH_THRESHOLD })
    .map((result) => ({
      label: result.obj.name,
      info: result.obj.description || undefined,
      apply: insertMention,
      mention: { kind: "skill", value: result.obj.name },
      icon: SKILL_ICON_SVG,
      matchIndexes: result.indexes ?? [],
    }));
}

interface CompletionTriggers {
  files: boolean;
  skills: boolean;
}

function matchTrigger(context: CompletionContext, triggers: CompletionTriggers) {
  const match =
    (triggers.files ? context.matchBefore(/@[^\s@[\]]*/) : null) ??
    (triggers.skills ? context.matchBefore(/\/[^\s/[\]]*/) : null);
  if (!match) return null;
  const before = context.state.sliceDoc(match.from - 1, match.from);
  return before && !/\s/.test(before) ? null : match;
}

function positionInfo(_view: EditorView, list: Rect, _option: Rect, info: Rect, space: Rect) {
  const infoWidth = info.right - info.left;
  const fitsRight = infoWidth <= space.right - list.right;
  if (fitsRight || infoWidth <= list.left - space.left) {
    return {
      style: list.bottom - (info.bottom - info.top) >= space.top ? "bottom: 0px" : "top: 0px",
      class: fitsRight ? "cm-completionInfo-right" : "cm-completionInfo-left",
    };
  }
  return {
    style: `bottom: ${list.bottom - list.top + 4}px; left: ${space.left - list.left + 8}px; max-width: ${space.right - space.left - 16}px`,
    class: "cm-completionInfo-right-narrow",
  };
}

const completionTheme = EditorView.theme({
  ".cm-tooltip.cm-tooltip-autocomplete, .cm-tooltip.cm-completionInfo": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-md)",
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  ".cm-tooltip.cm-tooltip-autocomplete": {
    padding: "0.25rem",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": {
    fontFamily: "inherit",
    minWidth: "11rem",
    maxWidth: "min(28rem, 90vw)",
    maxHeight: "14rem",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.125rem 0.375rem",
    borderRadius: "var(--radius-sm)",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "var(--muted)",
    color: "var(--foreground)",
  },
  ".cm-mention-icon": {
    display: "flex",
    flexShrink: "0",
  },
  ".cm-mention-icon svg": {
    width: "0.875rem",
    height: "0.875rem",
  },
  ".cm-completionLabel": {
    flexShrink: "0",
  },
  ".cm-completionDetail": {
    marginLeft: "0",
    minWidth: "0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontStyle: "normal",
    color: "var(--muted-foreground)",
  },
  ".cm-completionMatchedText": {
    textDecoration: "none",
    fontWeight: "600",
  },
  ".cm-tooltip.cm-completionInfo": {
    color: "var(--muted-foreground)",
    padding: "0.5rem",
    width: "16rem",
    maxHeight: "8rem",
    overflowY: "auto",
    whiteSpace: "normal",
  },
});

export function createChatInputMentions() {
  let getProject: () => Project | undefined = () => undefined;
  let triggers: CompletionTriggers = { files: true, skills: true };

  const source = async (context: CompletionContext): Promise<CompletionResult | null> => {
    const match = matchTrigger(context, triggers);
    if (!match) return null;
    const query = match.text.slice(1);
    const project = getProject();
    const options = match.text.startsWith("/")
      ? getSkillOptions(query, await getSkills(project))
      : project?.folder
        ? getFileOptions(query, await listProjectEntries(project.folder))
        : [];
    if (context.aborted || options.length === 0) return null;
    return {
      from: match.from,
      options,
      filter: false,
      getMatch: (completion) =>
        (completion as MentionCompletion).matchIndexes.flatMap((index) => [index, index + 1]),
    };
  };

  return {
    setProjectGetter: (next: () => Project | undefined) => {
      getProject = next;
    },
    setTriggers: (next: CompletionTriggers) => {
      triggers = next;
    },
    extension: [
      autocompletion({
        override: [source],
        icons: false,
        aboveCursor: true,
        positionInfo,
        addToOptions: [
          {
            position: 20,
            render: (completion) => {
              const icon = document.createElement("span");
              icon.className = "cm-mention-icon";
              icon.innerHTML = (completion as MentionCompletion).icon;
              return icon;
            },
          },
        ],
      }),
      tooltips({ position: "absolute" }),
      EditorView.domEventHandlers({
        focus: () => {
          const project = getProject();
          if (triggers.skills) void getSkills(project);
          if (triggers.files && project?.folder) void listProjectEntries(project.folder);
        },
      }),
      completionTheme,
      chatMentionChips,
    ],
  };
}
