import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatMessageLoading } from "./chat-message-loading";

vi.mock("@/contexts/use-chat/chat-hooks", () => ({
  useChatStatus: vi.fn(),
  useChatMessages: vi.fn(),
}));

vi.mock("@/contexts/use-api-keys/api-keys-hooks", () => ({
  useApiKeys: vi.fn(),
}));

vi.mock("@/contexts/use-tools/tools-hooks", () => ({
  useTools: vi.fn(),
}));

import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import { useChatMessages, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { useTools } from "@/contexts/use-tools/tools-hooks";

describe("ChatMessageLoading", () => {
  beforeEach(() => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "idle" });
    vi.mocked(useChatMessages).mockReturnValue([]);
    vi.mocked(useApiKeys).mockReturnValue({ isApiKeysLoading: false } as any);
    vi.mocked(useTools).mockReturnValue({ isMcpLoading: false } as any);
  });

  describe("inMessage mode", () => {
    it("renders nothing when not latest message", () => {
      vi.mocked(useChatMessages).mockReturnValue([
        { id: "1", role: "assistant", content: [] },
        { id: "2", role: "assistant", content: [] },
      ] as any);

      const { container } = render(
        <ChatMessageLoading mode="inMessage" messageId="1" messageRole="assistant" />
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when message role is not assistant", () => {
      vi.mocked(useChatMessages).mockReturnValue([
        { id: "1", role: "user", content: [] },
      ] as any);

      const { container } = render(
        <ChatMessageLoading mode="inMessage" messageId="1" messageRole="user" />
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders caret when streaming", () => {
      vi.mocked(useChatStatus).mockReturnValue({ status: "streaming" });
      vi.mocked(useChatMessages).mockReturnValue([
        { id: "1", role: "assistant", content: [] },
      ] as any);

      render(<ChatMessageLoading mode="inMessage" messageId="1" messageRole="assistant" />);

      expect(screen.getByText("|")).toBeInTheDocument();
    });

    it("renders 'Thinking...' when submitted", () => {
      vi.mocked(useChatStatus).mockReturnValue({ status: "submitted" });
      vi.mocked(useChatMessages).mockReturnValue([
        { id: "1", role: "assistant", content: [] },
      ] as any);

      render(<ChatMessageLoading mode="inMessage" messageId="1" messageRole="assistant" />);

      expect(screen.getByText("Thinking...")).toBeInTheDocument();
    });

    it("renders 'Loading API keys...' when API keys are loading", () => {
      vi.mocked(useChatStatus).mockReturnValue({ status: "submitted" });
      vi.mocked(useChatMessages).mockReturnValue([
        { id: "1", role: "assistant", content: [] },
      ] as any);
      vi.mocked(useApiKeys).mockReturnValue({ isApiKeysLoading: true } as any);

      render(<ChatMessageLoading mode="inMessage" messageId="1" messageRole="assistant" />);

      expect(screen.getByText("Loading API keys...")).toBeInTheDocument();
    });

    it("renders 'Starting MCP servers...' when MCP is loading", () => {
      vi.mocked(useChatStatus).mockReturnValue({ status: "submitted" });
      vi.mocked(useChatMessages).mockReturnValue([
        { id: "1", role: "assistant", content: [] },
      ] as any);
      vi.mocked(useTools).mockReturnValue({ isMcpLoading: true } as any);

      render(<ChatMessageLoading mode="inMessage" messageId="1" messageRole="assistant" />);

      expect(screen.getByText("Starting MCP servers...")).toBeInTheDocument();
    });
  });

  describe("inLayout mode", () => {
    it("renders nothing when streaming", () => {
      vi.mocked(useChatStatus).mockReturnValue({ status: "streaming" });

      const { container } = render(<ChatMessageLoading mode="inLayout" />);

      expect(container.firstChild).toBeNull();
    });

    it("renders 'Thinking...' when submitted with user message", () => {
      vi.mocked(useChatStatus).mockReturnValue({ status: "submitted" });
      vi.mocked(useChatMessages).mockReturnValue([
        { id: "1", role: "user", content: [] },
      ] as any);

      render(<ChatMessageLoading mode="inLayout" />);

      expect(screen.getByText("Thinking...")).toBeInTheDocument();
    });

    it("renders nothing when submitted with assistant message", () => {
      vi.mocked(useChatStatus).mockReturnValue({ status: "submitted" });
      vi.mocked(useChatMessages).mockReturnValue([
        { id: "1", role: "assistant", content: [] },
      ] as any);

      const { container } = render(<ChatMessageLoading mode="inLayout" />);

      expect(container.firstChild).toBeNull();
    });

    it("renders 'Loading API keys...' in layout when loading", () => {
      vi.mocked(useChatStatus).mockReturnValue({ status: "submitted" });
      vi.mocked(useChatMessages).mockReturnValue([
        { id: "1", role: "user", content: [] },
      ] as any);
      vi.mocked(useApiKeys).mockReturnValue({ isApiKeysLoading: true } as any);

      render(<ChatMessageLoading mode="inLayout" />);

      expect(screen.getByText("Loading API keys...")).toBeInTheDocument();
    });

    it("renders nothing when no messages", () => {
      vi.mocked(useChatStatus).mockReturnValue({ status: "idle" });
      vi.mocked(useChatMessages).mockReturnValue([]);

      const { container } = render(<ChatMessageLoading mode="inLayout" />);

      expect(container.firstChild).toBeNull();
    });
  });

  it("uses default mode when not specified", () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "idle" });
    const { container } = render(<ChatMessageLoading />);
    expect(container).toBeInTheDocument();
  });
});
