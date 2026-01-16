import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BranchButton } from "./branch-button";

vi.mock("@/contexts/use-chat/chat-hooks", () => ({
  useChatStatus: vi.fn(),
}));

import { useChatStatus } from "@/contexts/use-chat/chat-hooks";

describe("BranchButton", () => {
  beforeEach(() => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "idle" });
  });

  it("renders correctly", () => {
    const handleBranch = vi.fn();
    render(<BranchButton onBranch={handleBranch} />);
    
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has correct aria-label", () => {
    const handleBranch = vi.fn();
    render(<BranchButton onBranch={handleBranch} />);
    
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Branch conversation from this message");
  });

  it("renders GitBranch icon", () => {
    const handleBranch = vi.fn();
    const { container } = render(<BranchButton onBranch={handleBranch} />);
    
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("calls onBranch when clicked", async () => {
    const handleBranch = vi.fn();
    const user = userEvent.setup();
    render(<BranchButton onBranch={handleBranch} />);
    
    await user.click(screen.getByRole("button"));
    expect(handleBranch).toHaveBeenCalledTimes(1);
  });

  it("is disabled when streaming", () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "streaming" });
    const handleBranch = vi.fn();
    render(<BranchButton onBranch={handleBranch} />);
    
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when submitted", () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "submitted" });
    const handleBranch = vi.fn();
    render(<BranchButton onBranch={handleBranch} />);
    
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is enabled when idle", () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "idle" });
    const handleBranch = vi.fn();
    render(<BranchButton onBranch={handleBranch} />);
    
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("does not call onBranch when disabled", async () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "streaming" });
    const handleBranch = vi.fn();
    const user = userEvent.setup();
    render(<BranchButton onBranch={handleBranch} />);
    
    await user.click(screen.getByRole("button"));
    expect(handleBranch).not.toHaveBeenCalled();
  });

  it("accepts custom className", () => {
    const handleBranch = vi.fn();
    render(<BranchButton onBranch={handleBranch} className="custom-class" />);
    
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("has icon size variant", () => {
    const handleBranch = vi.fn();
    const { container } = render(<BranchButton onBranch={handleBranch} />);
    
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("has secondary variant", () => {
    const handleBranch = vi.fn();
    render(<BranchButton onBranch={handleBranch} />);
    
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});
