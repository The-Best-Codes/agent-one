import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MessageActionRow } from "./index";

vi.mock("jotai", () => ({
  useAtom: vi.fn(() => ["hover", vi.fn()]),
  useAtomValue: vi.fn(),
}));

vi.mock("@/components/a1/copy-button", () => ({
  CopyButton: ({ text, className }: { text: string; className: string }) => (
    <button className={className} data-testid="copy-button">
      Copy
    </button>
  ),
}));

vi.mock("./branch-button", () => ({
  BranchButton: ({
    onBranch,
    className,
  }: {
    onBranch: () => void;
    className: string;
  }) => (
    <button className={className} onClick={onBranch} data-testid="branch-button">
      Branch
    </button>
  ),
}));

vi.mock("./edit-button", () => ({
  EditButton: ({
    onEdit,
    className,
  }: {
    onEdit: () => void;
    className: string;
  }) => (
    <button className={className} onClick={onEdit} data-testid="edit-button">
      Edit
    </button>
  ),
}));

vi.mock("./retry-button", () => ({
  RetryButton: ({ className }: { className: string }) => (
    <button className={className} data-testid="retry-button">
      Retry
    </button>
  ),
}));

describe("MessageActionRow", () => {
  it("renders copy button for all messages", () => {
    render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="user"
        messageId="msg-1"
      />,
    );
    expect(screen.getByTestId("copy-button")).toBeInTheDocument();
  });

  it("renders edit button when onEdit is provided", () => {
    const onEdit = vi.fn();
    render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="user"
        messageId="msg-1"
        onEdit={onEdit}
      />,
    );
    expect(screen.getByTestId("edit-button")).toBeInTheDocument();
  });

  it("does not render edit button when onEdit is not provided", () => {
    render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="user"
        messageId="msg-1"
      />,
    );
    expect(screen.queryByTestId("edit-button")).not.toBeInTheDocument();
  });

  it("renders branch button for assistant messages when onBranch provided", () => {
    const onBranch = vi.fn();
    render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="assistant"
        messageId="msg-1"
        onBranch={onBranch}
      />,
    );
    expect(screen.getByTestId("branch-button")).toBeInTheDocument();
  });

  it("does not render branch button for user messages", () => {
    const onBranch = vi.fn();
    render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="user"
        messageId="msg-1"
        onBranch={onBranch}
      />,
    );
    expect(screen.queryByTestId("branch-button")).not.toBeInTheDocument();
  });

  it("renders retry button for assistant messages", () => {
    render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="assistant"
        messageId="msg-1"
      />,
    );
    expect(screen.getByTestId("retry-button")).toBeInTheDocument();
  });

  it("does not render retry button for user messages", () => {
    render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="user"
        messageId="msg-1"
      />,
    );
    expect(screen.queryByTestId("retry-button")).not.toBeInTheDocument();
  });

  it("applies correct styles for user messages", () => {
    const { container } = render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="user"
        messageId="msg-1"
      />,
    );
    const wrapper = container.firstChild;
    expect(wrapper).not.toHaveClass("ml-2");
  });

  it("applies correct styles for assistant messages", () => {
    const { container } = render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="assistant"
        messageId="msg-1"
      />,
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("ml-2");
  });

  it("renders all buttons for assistant message with all handlers", () => {
    const onEdit = vi.fn();
    const onBranch = vi.fn();
    render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="assistant"
        messageId="msg-1"
        onEdit={onEdit}
        onBranch={onBranch}
      />,
    );
    expect(screen.getByTestId("copy-button")).toBeInTheDocument();
    expect(screen.getByTestId("branch-button")).toBeInTheDocument();
    expect(screen.getByTestId("retry-button")).toBeInTheDocument();
    expect(screen.getByTestId("edit-button")).toBeInTheDocument();
  });

  it("renders correct buttons for user message with edit handler", () => {
    const onEdit = vi.fn();
    render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="user"
        messageId="msg-1"
        onEdit={onEdit}
      />,
    );
    expect(screen.getByTestId("copy-button")).toBeInTheDocument();
    expect(screen.getByTestId("edit-button")).toBeInTheDocument();
    expect(screen.queryByTestId("branch-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("retry-button")).not.toBeInTheDocument();
  });

  it("shows hover tooltip content", () => {
    render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="assistant"
        messageId="msg-1"
      />,
    );
    expect(screen.getByText("Copy message")).toBeInTheDocument();
    expect(screen.getByText("Regenerate response")).toBeInTheDocument();
  });

  it("has transition classes", () => {
    const { container } = render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="user"
        messageId="msg-1"
      />,
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("transition-opacity");
  });

  it("renders with 'always' visibility setting", () => {
    const { useAtom } = require("jotai");
    useAtom.mockReturnValue(["always", vi.fn()]);
    
    const { container } = render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="user"
        messageId="msg-1"
      />,
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("opacity-100");
  });

  it("renders with 'never' visibility setting", () => {
    const { useAtom } = require("jotai");
    useAtom.mockReturnValue(["never", vi.fn()]);
    
    const { container } = render(
      <MessageActionRow
        contentToCopy="test content"
        messageRole="user"
        messageId="msg-1"
      />,
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("hidden");
  });
});
