import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MainInputIncompleteSection } from "./incomplete-section";

vi.mock("@/contexts/use-chat/chat-hooks", () => ({
  useChatStatus: vi.fn(() => ({
    error: null,
    status: "idle",
  })),
  useChatFunctions: vi.fn(() => ({
    regenerate: vi.fn(),
  })),
  useChatMessages: vi.fn(() => []),
}));

describe("MainInputIncompleteSection", () => {
  it("returns null when no messages", () => {
    const { container } = render(<MainInputIncompleteSection />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when there is an error", () => {
    const { useChatStatus } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({
      error: { message: "Error" },
      status: "idle",
    });

    const { container } = render(<MainInputIncompleteSection />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when status is streaming", () => {
    const { useChatStatus, useChatMessages } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({
      error: null,
      status: "streaming",
    });
    useChatMessages.mockReturnValue([
      { role: "user", content: "Hello" },
    ]);

    const { container } = render(<MainInputIncompleteSection />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when status is submitted", () => {
    const { useChatStatus, useChatMessages } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({
      error: null,
      status: "submitted",
    });
    useChatMessages.mockReturnValue([
      { role: "user", content: "Hello" },
    ]);

    const { container } = render(<MainInputIncompleteSection />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when last message is from assistant", () => {
    const { useChatMessages } = require("@/contexts/use-chat/chat-hooks");
    useChatMessages.mockReturnValue([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
    ]);

    const { container } = render(<MainInputIncompleteSection />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when last message is from user", () => {
    const { useChatMessages } = require("@/contexts/use-chat/chat-hooks");
    useChatMessages.mockReturnValue([
      { role: "user", content: "Hello" },
    ]);

    render(<MainInputIncompleteSection />);
    expect(screen.getByText("Incomplete Chat")).toBeInTheDocument();
  });

  it("shows incomplete chat message", () => {
    const { useChatMessages } = require("@/contexts/use-chat/chat-hooks");
    useChatMessages.mockReturnValue([
      { role: "user", content: "Hello" },
    ]);

    render(<MainInputIncompleteSection />);
    expect(screen.getByText("Incomplete Chat")).toBeInTheDocument();
    expect(
      screen.getByText("The last message didn't receive a response."),
    ).toBeInTheDocument();
  });

  it("renders retry button", () => {
    const { useChatMessages } = require("@/contexts/use-chat/chat-hooks");
    useChatMessages.mockReturnValue([
      { role: "user", content: "Hello" },
    ]);

    render(<MainInputIncompleteSection />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("calls regenerate when retry clicked", async () => {
    const user = userEvent.setup();
    const regenerate = vi.fn();
    const { useChatMessages, useChatFunctions } = require("@/contexts/use-chat/chat-hooks");
    
    useChatMessages.mockReturnValue([
      { role: "user", content: "Hello" },
    ]);
    useChatFunctions.mockReturnValue({
      regenerate,
    });

    render(<MainInputIncompleteSection />);
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(regenerate).toHaveBeenCalled();
  });

  it("calls onRetry callback when retry clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { useChatMessages } = require("@/contexts/use-chat/chat-hooks");
    
    useChatMessages.mockReturnValue([
      { role: "user", content: "Hello" },
    ]);

    render(<MainInputIncompleteSection onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("has muted styling", () => {
    const { useChatMessages } = require("@/contexts/use-chat/chat-hooks");
    useChatMessages.mockReturnValue([
      { role: "user", content: "Hello" },
    ]);

    const { container } = render(<MainInputIncompleteSection />);
    const section = container.querySelector(".bg-muted\\/50");
    expect(section).toBeInTheDocument();
  });

  it("renders retry button with refresh icon", () => {
    const { useChatMessages } = require("@/contexts/use-chat/chat-hooks");
    useChatMessages.mockReturnValue([
      { role: "user", content: "Hello" },
    ]);

    const { container } = render(<MainInputIncompleteSection />);
    const retryButton = screen.getByRole("button", { name: /retry/i });
    const icon = retryButton.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("has scrollable content container", () => {
    const { useChatMessages } = require("@/contexts/use-chat/chat-hooks");
    useChatMessages.mockReturnValue([
      { role: "user", content: "Hello" },
    ]);

    const { container } = render(<MainInputIncompleteSection />);
    const scrollContainer = container.querySelector(".overflow-auto");
    expect(scrollContainer).toBeInTheDocument();
  });

  it("handles multiple user messages correctly", () => {
    const { useChatMessages } = require("@/contexts/use-chat/chat-hooks");
    useChatMessages.mockReturnValue([
      { role: "user", content: "First message" },
      { role: "assistant", content: "Response" },
      { role: "user", content: "Second message" },
    ]);

    render(<MainInputIncompleteSection />);
    expect(screen.getByText("Incomplete Chat")).toBeInTheDocument();
  });
});
