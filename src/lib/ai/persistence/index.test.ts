import type { UIMessage } from "ai";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createChat,
  deleteChat,
  forkChat,
  getNewChatModelId,
  listChatIds,
  loadChatData,
  saveChat,
  saveChatModel,
  saveChatTitle,
  saveChatTitleState,
  saveNewChatModelId,
} from "./index";

// TODO: Is there an official lib for this?
// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Chat Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, "dispatchEvent");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("New Chat Model ID", () => {
    it("should save and retrieve the new chat model ID", () => {
      const modelId = "gemini-pro";
      saveNewChatModelId(modelId);
      expect(getNewChatModelId()).toBe(modelId);
    });

    it("should return null if no model ID is saved", () => {
      expect(getNewChatModelId()).toBeNull();
    });
  });
  describe("Chat Management", () => {
    it("should create a new chat and add it to the list of chat IDs", () => {
      const modelId = "gemini-pro";
      const newChatId = createChat(modelId);

      const chatIds = listChatIds();
      expect(chatIds).toContain(newChatId);
      expect(chatIds.length).toBe(1);

      const chatData = loadChatData(newChatId);
      expect(chatData).toEqual({
        messages: [],
        title: "New chat",
        titleState: undefined,
        modelId,
      });
    });

    it("should delete a chat and remove it from the list of chat IDs", () => {
      const modelId = "gemini-pro";
      const chatId = createChat(modelId);

      let chatIds = listChatIds();
      expect(chatIds).toContain(chatId);

      deleteChat(chatId);

      chatIds = listChatIds();
      expect(chatIds).not.toContain(chatId);
      expect(loadChatData(chatId)).toEqual({ messages: [], title: "New chat" }); // Or check for null
    });

    it("should save and load chat messages", () => {
      const modelId = "gemini-pro";
      const chatId = createChat(modelId);
      const messages: UIMessage[] = [
        { id: "1", role: "user", parts: [{ type: "text", text: "Hello" }] },
      ];

      saveChat({ chatId, messages });

      const chatData = loadChatData(chatId);
      expect(chatData.messages).toEqual(messages);
    });

    it("should save and load chat model", () => {
      const modelId = "gemini-pro";
      const chatId = createChat(modelId);
      const newModelId = "gemini-ultra";

      saveChatModel({ chatId, modelId: newModelId });

      const chatData = loadChatData(chatId);
      expect(chatData.modelId).toBe(newModelId);
    });

    it("should save and load chat title", () => {
      const modelId = "gemini-pro";
      const chatId = createChat(modelId);
      const newTitle = "My Test Chat";

      saveChatTitle({ chatId, title: newTitle });

      const chatData = loadChatData(chatId);
      expect(chatData.title).toBe(newTitle);
      expect(chatData.titleState).toBe("generated");
    });

    it("should save and load chat title state", () => {
      const modelId = "gemini-pro";
      const chatId = createChat(modelId);

      saveChatTitleState({ chatId, titleState: "generating" });
      let chatData = loadChatData(chatId);
      expect(chatData.titleState).toBe("generating");

      saveChatTitleState({ chatId, titleState: "error" });
      chatData = loadChatData(chatId);
      expect(chatData.titleState).toBe("error");
    });

    it("should fork a chat correctly", () => {
      const modelId = "gemini-pro";
      const originalChatId = createChat(modelId);
      const messages: UIMessage[] = [
        { id: "1", role: "user", parts: [{ type: "text", text: "Message 1" }] },
        {
          id: "2",
          role: "assistant",
          parts: [{ type: "text", text: "Message 2" }],
        },
        { id: "3", role: "user", parts: [{ type: "text", text: "Message 3" }] },
      ];
      saveChat({ chatId: originalChatId, messages });
      saveChatTitle({ chatId: originalChatId, title: "Original Title" });

      const forkFromMessageId = "2";
      const forkedChatId = forkChat({ originalChatId, forkFromMessageId });

      const forkedChatData = loadChatData(forkedChatId);
      expect(forkedChatData.title).toBe("Fork of Original Title");
      expect(forkedChatData.messages.length).toBe(2);
      expect(forkedChatData.messages[0].id).toBe("1");
      expect(forkedChatData.messages[1].id).toBe("2");
      expect(forkedChatData.modelId).toBe(modelId);

      const chatIds = listChatIds();
      expect(chatIds).toContain(forkedChatId);
    });

    it("should dispatch events on create, delete, and title update", () => {
      const modelId = "gemini-pro";

      // Create
      const chatId = createChat(modelId);
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        new CustomEvent("persistence:chat-created", { detail: { chatId } }),
      );

      // Title Update
      const newTitle = "Updated Title";
      saveChatTitle({ chatId, title: newTitle });
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        new CustomEvent("persistence:chat-title-updated", {
          detail: { chatId, title: newTitle },
        }),
      );

      // Delete
      deleteChat(chatId);
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        new CustomEvent("persistence:chat-deleted", { detail: { chatId } }),
      );
    });
  });
});
