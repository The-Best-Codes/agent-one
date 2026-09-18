const STORAGE_KEY = "agent-one-chat-input-drafts";
const MAX_STORAGE_BYTES = 500 * 1024;
const MAX_DRAFT_LENGTH = 20_000;

type ChatInputDraft = { text: string; savedAt: number };
type ChatInputDrafts = Record<string, ChatInputDraft>;

const getDrafts = (): ChatInputDrafts => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) =>
          value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          typeof (value as ChatInputDraft).text === "string" &&
          typeof (value as ChatInputDraft).savedAt === "number",
      ),
    ) as ChatInputDrafts;
  } catch {
    return {};
  }
};

const saveDrafts = (drafts: ChatInputDrafts) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // no-op
  }
};

export const loadChatInputDraft = (chatId: string): string => getDrafts()[chatId]?.text ?? "";

export const saveChatInputDraft = (chatId: string, text: string) => {
  if (text.length > MAX_DRAFT_LENGTH) return;
  const drafts = getDrafts();
  if (text) drafts[chatId] = { text, savedAt: Date.now() };
  else delete drafts[chatId];

  while (new Blob([JSON.stringify(drafts)]).size > MAX_STORAGE_BYTES) {
    const oldestKey = Object.entries(drafts).sort(
      ([, first], [, second]) => first.savedAt - second.savedAt,
    )[0]?.[0];
    if (!oldestKey) break;
    delete drafts[oldestKey];
  }
  saveDrafts(drafts);
};
