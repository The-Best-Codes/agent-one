import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MessagePartText } from "./text";

vi.mock("jotai", () => ({
  useAtomValue: vi.fn((atom) => {
    if (atom.toString().includes("maxMessageLength")) return 50000;
    if (atom.toString().includes("markdownRendering")) return "both";
    return undefined;
  }),
}));

vi.mock("@/components/a1/markdown/memoized-markdown", () => ({
  MemoizedMarkdown: ({ content }: { content: string }) => <div data-testid="memoized-markdown">{content}</div>,
}));

vi.mock("@/components/a1/markdown/performant-markdown", () => ({
  PerformantMarkdown: ({ content }: { content: string }) => <div data-testid="performant-markdown">{content}</div>,
}));

describe("MessagePartText", () => {
  it("renders text content", () => {
    render(
      <MessagePartText id="test-1" text="Hello world" messageRole="user" />,
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("returns null when text is empty", () => {
    const { container } = render(
      <MessagePartText id="test-1" text="" messageRole="user" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders markdown for user messages when enabled", () => {
    render(
      <MessagePartText id="test-1" text="# Heading" messageRole="user" />,
    );
    expect(screen.getByTestId("memoized-markdown")).toBeInTheDocument();
  });

  it("renders markdown for assistant messages when enabled", () => {
    render(
      <MessagePartText id="test-1" text="# Heading" messageRole="assistant" />,
    );
    expect(screen.getByTestId("memoized-markdown")).toBeInTheDocument();
  });

  it("applies prose classes when markdown is rendered", () => {
    const { container } = render(
      <MessagePartText id="test-1" text="Test" messageRole="user" />,
    );
    const proseDiv = container.querySelector(".prose");
    expect(proseDiv).toBeInTheDocument();
  });

  it("shows performance alert for long messages", () => {
    const longText = "a".repeat(60000);
    render(
      <MessagePartText id="test-1" text={longText} messageRole="user" />,
    );
    expect(screen.getByText("Performance Alert")).toBeInTheDocument();
  });

  it("uses performant renderer for long messages", () => {
    const longText = "a".repeat(60000);
    render(
      <MessagePartText id="test-1" text={longText} messageRole="user" />,
    );
    expect(screen.getByTestId("performant-markdown")).toBeInTheDocument();
  });

  it("shows character count in performance alert", () => {
    const longText = "a".repeat(60000);
    render(
      <MessagePartText id="test-1" text={longText} messageRole="user" />,
    );
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
  });

  it("has correct structure", () => {
    const { container } = render(
      <MessagePartText id="test-1" text="Content" messageRole="user" />,
    );
    const wrapper = container.querySelector(".max-w-full");
    expect(wrapper).toBeInTheDocument();
  });
});
