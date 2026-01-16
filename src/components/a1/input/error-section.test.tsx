import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MainInputErrorSection } from "./error-section";

vi.mock("@/contexts/use-chat/chat-hooks", () => ({
  useChatStatus: vi.fn(() => ({
    error: null,
  })),
  useChatFunctions: vi.fn(() => ({
    regenerate: vi.fn(),
    clearError: vi.fn(),
  })),
}));

vi.mock("@/lib/error/ai-error-messages", () => ({
  getAiErrorMessageUx: vi.fn((message) => ({
    message: "Error occurred",
    description: "Please try again",
  })),
}));

describe("MainInputErrorSection", () => {
  it("returns null when no error", () => {
    const { container } = render(<MainInputErrorSection />);
    expect(container.firstChild).toBeNull();
  });

  it("renders error message when error exists", () => {
    const { useChatStatus } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({
      error: { message: "Test error" },
    });

    render(<MainInputErrorSection />);
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });

  it("renders error description when error exists", () => {
    const { useChatStatus } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({
      error: { message: "Test error" },
    });

    render(<MainInputErrorSection />);
    expect(screen.getByText("Please try again")).toBeInTheDocument();
  });

  it("renders retry button when error exists", () => {
    const { useChatStatus } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({
      error: { message: "Test error" },
    });

    render(<MainInputErrorSection />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("renders close button when error exists", () => {
    const { useChatStatus } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({
      error: { message: "Test error" },
    });

    render(<MainInputErrorSection />);
    const closeButton = screen.getByTitle("Ignore error");
    expect(closeButton).toBeInTheDocument();
  });

  it("calls regenerate when retry clicked", async () => {
    const user = userEvent.setup();
    const regenerate = vi.fn();
    const { useChatStatus, useChatFunctions } = require("@/contexts/use-chat/chat-hooks");
    
    useChatStatus.mockReturnValue({
      error: { message: "Test error" },
    });
    useChatFunctions.mockReturnValue({
      regenerate,
      clearError: vi.fn(),
    });

    render(<MainInputErrorSection />);
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(regenerate).toHaveBeenCalled();
  });

  it("calls clearError when close clicked", async () => {
    const user = userEvent.setup();
    const clearError = vi.fn();
    const { useChatStatus, useChatFunctions } = require("@/contexts/use-chat/chat-hooks");
    
    useChatStatus.mockReturnValue({
      error: { message: "Test error" },
    });
    useChatFunctions.mockReturnValue({
      regenerate: vi.fn(),
      clearError,
    });

    render(<MainInputErrorSection />);
    await user.click(screen.getByTitle("Ignore error"));
    expect(clearError).toHaveBeenCalled();
  });

  it("calls onRetry callback when retry clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { useChatStatus } = require("@/contexts/use-chat/chat-hooks");
    
    useChatStatus.mockReturnValue({
      error: { message: "Test error" },
    });

    render(<MainInputErrorSection onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("has destructive styling", () => {
    const { useChatStatus } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({
      error: { message: "Test error" },
    });

    const { container } = render(<MainInputErrorSection />);
    const errorSection = container.querySelector(".bg-destructive\\/20");
    expect(errorSection).toBeInTheDocument();
  });

  it("renders retry button with refresh icon", () => {
    const { useChatStatus } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({
      error: { message: "Test error" },
    });

    const { container } = render(<MainInputErrorSection />);
    const retryButton = screen.getByRole("button", { name: /retry/i });
    const icon = retryButton.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("renders close button with X icon", () => {
    const { useChatStatus } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({
      error: { message: "Test error" },
    });

    const { container } = render(<MainInputErrorSection />);
    const closeButton = screen.getByTitle("Ignore error");
    const icon = closeButton.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("shows tooltip on retry button hover", async () => {
    const user = userEvent.setup();
    const { useChatStatus } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({
      error: { message: "Test error" },
    });

    render(<MainInputErrorSection />);
    await user.hover(screen.getByRole("button", { name: /retry/i }));
  });

  it("has scrollable error content container", () => {
    const { useChatStatus } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({
      error: { message: "Test error" },
    });

    const { container } = render(<MainInputErrorSection />);
    const scrollContainer = container.querySelector(".overflow-auto");
    expect(scrollContainer).toBeInTheDocument();
  });
});
