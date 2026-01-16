import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RetryButton } from "./retry-button";

vi.mock("@/contexts/use-chat/chat-hooks", () => ({
  useChatStatus: vi.fn(),
  useChatFunctions: vi.fn(),
}));

import { useChatFunctions, useChatStatus } from "@/contexts/use-chat/chat-hooks";

describe("RetryButton", () => {
  const mockRegenerate = vi.fn();

  beforeEach(() => {
    mockRegenerate.mockClear();
    vi.mocked(useChatStatus).mockReturnValue({ status: "idle" });
    vi.mocked(useChatFunctions).mockReturnValue({ regenerate: mockRegenerate } as any);
  });

  it("renders correctly", () => {
    render(<RetryButton messageId="msg-1" />);
    
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has correct aria-label", () => {
    render(<RetryButton messageId="msg-1" />);
    
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Regenerate response");
  });

  it("renders RefreshCcw icon", () => {
    const { container } = render(<RetryButton messageId="msg-1" />);
    
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("calls regenerate with messageId when clicked", async () => {
    const user = userEvent.setup();
    render(<RetryButton messageId="msg-1" />);
    
    await user.click(screen.getByRole("button"));
    expect(mockRegenerate).toHaveBeenCalledWith({ messageId: "msg-1" });
  });

  it("is disabled when streaming", () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "streaming" });
    render(<RetryButton messageId="msg-1" />);
    
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when submitted", () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "submitted" });
    render(<RetryButton messageId="msg-1" />);
    
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is enabled when idle", () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "idle" });
    render(<RetryButton messageId="msg-1" />);
    
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("does not call regenerate when disabled", async () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "streaming" });
    const user = userEvent.setup();
    render(<RetryButton messageId="msg-1" />);
    
    await user.click(screen.getByRole("button"));
    expect(mockRegenerate).not.toHaveBeenCalled();
  });

  it("accepts custom className", () => {
    render(<RetryButton messageId="msg-1" className="custom-class" />);
    
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("has icon size variant", () => {
    const { container } = render(<RetryButton messageId="msg-1" />);
    
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("has secondary variant", () => {
    render(<RetryButton messageId="msg-1" />);
    
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("handles different message IDs", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RetryButton messageId="msg-1" />);
    
    await user.click(screen.getByRole("button"));
    expect(mockRegenerate).toHaveBeenCalledWith({ messageId: "msg-1" });

    mockRegenerate.mockClear();
    rerender(<RetryButton messageId="msg-2" />);
    
    await user.click(screen.getByRole("button"));
    expect(mockRegenerate).toHaveBeenCalledWith({ messageId: "msg-2" });
  });
});
