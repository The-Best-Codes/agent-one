import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NoMessagesGreeting } from "./no-messages";

vi.mock("jotai", () => ({
  useAtomValue: vi.fn(),
}));

import { useAtomValue } from "jotai";

describe("NoMessagesGreeting", () => {
  beforeEach(() => {
    vi.mocked(useAtomValue).mockReturnValue("");
  });

  it("renders correctly", () => {
    render(<NoMessagesGreeting />);
    const heading = screen.getByRole("heading");
    expect(heading).toBeInTheDocument();
  });

  it("displays a greeting phrase", () => {
    render(<NoMessagesGreeting />);
    const heading = screen.getByRole("heading");
    expect(heading.textContent).toBeTruthy();
  });

  it("includes user name when provided", () => {
    vi.mocked(useAtomValue).mockReturnValue("John");
    render(<NoMessagesGreeting />);
    
    const heading = screen.getByRole("heading");
    const possiblePhrases = [
      "What's on your mind, John?",
      "Where should we begin, John?",
      "How can I help you today, John?",
      "I'm all ears, John!",
      "What can I help with, John?",
      "Where should we start, John?",
      "Ask me anything.",
      "Ready when you are.",
      "What's on your mind today, John?",
      "What are you working on, John?",
      "What's on the agenda today, John?",
      "How can I help, John?",
      "What can I do for you, John?",
    ];
    
    expect(possiblePhrases).toContain(heading.textContent);
  });

  it("displays generic phrases without user name", () => {
    vi.mocked(useAtomValue).mockReturnValue("");
    render(<NoMessagesGreeting />);
    
    const heading = screen.getByRole("heading");
    const possiblePhrases = [
      "What's on your mind?",
      "Where should we begin?",
      "How can I help you today?",
      "I'm all ears!",
      "What can I help with?",
      "Where should we start?",
      "Ask me anything.",
      "Ready when you are.",
      "What's on your mind today?",
      "What are you working on?",
      "What's on the agenda today?",
      "How can I help?",
      "What can I do for you?",
    ];
    
    expect(possiblePhrases).toContain(heading.textContent);
  });

  it("renders with correct text size", () => {
    render(<NoMessagesGreeting />);
    const heading = screen.getByRole("heading");
    expect(heading).toHaveClass("text-2xl");
  });

  it("is centered", () => {
    render(<NoMessagesGreeting />);
    const heading = screen.getByRole("heading");
    expect(heading).toHaveClass("text-center");
  });

  it("has select-none class", () => {
    render(<NoMessagesGreeting />);
    const heading = screen.getByRole("heading");
    expect(heading).toHaveClass("select-none");
  });

  it("renders consistently on multiple renders", () => {
    const { rerender } = render(<NoMessagesGreeting />);
    const firstText = screen.getByRole("heading").textContent;
    
    rerender(<NoMessagesGreeting />);
    const secondText = screen.getByRole("heading").textContent;
    
    expect(firstText).toBe(secondText);
  });
});
