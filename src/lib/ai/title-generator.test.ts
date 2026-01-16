import { describe, expect, it } from "vitest";
import type { TextPart, UIMessage } from "ai";
import {
  generateChatTitleFromSettings,
  hasMessageTextContent,
} from "./title-generator";
import type { TitleGenerationSettings } from "@/lib/settings/types";

// Helper to create a UIMessage with text content
function createTextMessage(
  role: "user" | "assistant",
  text: string,
): UIMessage {
  return {
    id: `msg-${Date.now()}`,
    role,
    parts: [{ type: "text", text } as TextPart],
    createdAt: new Date(),
  };
}

// Helper to create empty message
function createEmptyMessage(role: "user" | "assistant"): UIMessage {
  return {
    id: `msg-${Date.now()}`,
    role,
    parts: [],
    createdAt: new Date(),
  };
}

describe("title-generator", () => {
  describe("hasMessageTextContent", () => {
    it("should return true for messages with text content", () => {
      const message = createTextMessage("user", "Hello world");
      expect(hasMessageTextContent(message)).toBe(true);
    });

    it("should return false for messages without text parts", () => {
      const message = createEmptyMessage("user");
      expect(hasMessageTextContent(message)).toBe(false);
    });

    it("should return false for messages with only whitespace", () => {
      const message = createTextMessage("user", "   ");
      expect(hasMessageTextContent(message)).toBe(false);
    });

    it("should return true for messages with multiple text parts", () => {
      const message: UIMessage = {
        id: "msg-1",
        role: "user",
        parts: [
          { type: "text", text: "Hello" } as TextPart,
          { type: "text", text: "World" } as TextPart,
        ],
        createdAt: new Date(),
      };
      expect(hasMessageTextContent(message)).toBe(true);
    });
  });

  describe("generateChatTitleFromSettings", () => {
    const baseSettings: TitleGenerationSettings = {
      method: "first-user-message",
      characterLimit: 50,
      customPhrase: "Custom Title",
      fallbackPhrase: "New Chat",
    };

    describe("first-user-message method", () => {
      it("should extract title from first user message", () => {
        const messages = [
          createTextMessage("user", "What is TypeScript?"),
          createTextMessage("assistant", "TypeScript is a typed superset..."),
        ];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "first-user-message",
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("What is TypeScript?");
      });

      it("should truncate long user messages", () => {
        const longText =
          "This is a very long message that exceeds the character limit";
        const messages = [createTextMessage("user", longText)];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "first-user-message",
          characterLimit: 20,
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("This is a very lo...");
        expect(title?.length).toBeLessThanOrEqual(20);
      });

      it("should return fallback when no user message exists", () => {
        const messages = [
          createTextMessage("assistant", "Hello! How can I help?"),
        ];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "first-user-message",
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("New Chat");
      });

      it("should return fallback for empty user message", () => {
        const messages = [createTextMessage("user", "")];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "first-user-message",
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("New Chat");
      });
    });

    describe("first-assistant-message method", () => {
      it("should extract title from first assistant message", () => {
        const messages = [
          createTextMessage("user", "Hello"),
          createTextMessage("assistant", "Hi! How can I help you today?"),
        ];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "first-assistant-message",
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("Hi! How can I help you today?");
      });

      it("should truncate long assistant messages", () => {
        const longText =
          "This is a very long assistant response that will need to be truncated";
        const messages = [
          createTextMessage("user", "Hello"),
          createTextMessage("assistant", longText),
        ];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "first-assistant-message",
          characterLimit: 25,
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("This is a very long as...");
        expect(title?.length).toBeLessThanOrEqual(25);
      });

      it("should return null when no assistant message exists", () => {
        const messages = [createTextMessage("user", "Hello")];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "first-assistant-message",
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe(null);
      });
    });

    describe("custom method", () => {
      it("should return custom phrase when provided", () => {
        const messages = [createTextMessage("user", "Any message")];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "custom",
          customPhrase: "My Custom Title",
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("My Custom Title");
      });

      it("should return fallback when custom phrase is empty", () => {
        const messages = [createTextMessage("user", "Any message")];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "custom",
          customPhrase: "",
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("New Chat");
      });

      it("should return fallback when custom phrase is null", () => {
        const messages = [createTextMessage("user", "Any message")];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "custom",
          customPhrase: null as unknown as string,
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("New Chat");
      });
    });

    describe("ai method", () => {
      it("should return null for AI method (defers to async generation)", () => {
        const messages = [createTextMessage("user", "Hello")];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "ai",
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe(null);
      });
    });

    describe("edge cases", () => {
      it("should handle empty message array", () => {
        const messages: UIMessage[] = [];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "first-user-message",
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("New Chat");
      });

      it("should handle messages with multiple text parts", () => {
        const message: UIMessage = {
          id: "msg-1",
          role: "user",
          parts: [
            { type: "text", text: "Part 1" } as TextPart,
            { type: "text", text: "Part 2" } as TextPart,
          ],
          createdAt: new Date(),
        };
        const messages = [message];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "first-user-message",
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("Part 1 Part 2");
      });

      it("should respect exact character limit", () => {
        const messages = [createTextMessage("user", "12345678901234567890")];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "first-user-message",
          characterLimit: 10,
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("1234567...");
      });

      it("should not truncate when under limit", () => {
        const messages = [createTextMessage("user", "Short")];
        const settings: TitleGenerationSettings = {
          ...baseSettings,
          method: "first-user-message",
          characterLimit: 50,
        };

        const title = generateChatTitleFromSettings(messages, settings);
        expect(title).toBe("Short");
      });
    });
  });
});
