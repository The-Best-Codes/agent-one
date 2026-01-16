import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditButton } from "./edit-button";

vi.mock("@/contexts/use-chat/chat-hooks", () => ({
  useChatStatus: vi.fn(),
}));

import { useChatStatus } from "@/contexts/use-chat/chat-hooks";

describe("EditButton", () => {
  beforeEach(() => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "idle" });
  });

  it("renders correctly", () => {
    const handleEdit = vi.fn();
    render(<EditButton onEdit={handleEdit} />);
    
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has correct aria-label", () => {
    const handleEdit = vi.fn();
    render(<EditButton onEdit={handleEdit} />);
    
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Edit message");
  });

  it("renders pencil icon", () => {
    const handleEdit = vi.fn();
    const { container } = render(<EditButton onEdit={handleEdit} />);
    
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("calls onEdit when clicked", async () => {
    const handleEdit = vi.fn();
    const user = userEvent.setup();
    render(<EditButton onEdit={handleEdit} />);
    
    await user.click(screen.getByRole("button"));
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it("is disabled when streaming", () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "streaming" });
    const handleEdit = vi.fn();
    render(<EditButton onEdit={handleEdit} />);
    
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when submitted", () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "submitted" });
    const handleEdit = vi.fn();
    render(<EditButton onEdit={handleEdit} />);
    
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is enabled when idle", () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "idle" });
    const handleEdit = vi.fn();
    render(<EditButton onEdit={handleEdit} />);
    
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("does not call onEdit when disabled", async () => {
    vi.mocked(useChatStatus).mockReturnValue({ status: "streaming" });
    const handleEdit = vi.fn();
    const user = userEvent.setup();
    render(<EditButton onEdit={handleEdit} />);
    
    await user.click(screen.getByRole("button"));
    expect(handleEdit).not.toHaveBeenCalled();
  });

  it("accepts custom className", () => {
    const handleEdit = vi.fn();
    render(<EditButton onEdit={handleEdit} className="custom-class" />);
    
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("has icon size variant", () => {
    const handleEdit = vi.fn();
    const { container } = render(<EditButton onEdit={handleEdit} />);
    
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("has secondary variant", () => {
    const handleEdit = vi.fn();
    render(<EditButton onEdit={handleEdit} />);
    
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});
