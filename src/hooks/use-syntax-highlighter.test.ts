import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import useSyntaxHighlighter from "./use-syntax-highlighter";

// Mock the highlighter client
vi.mock("@/lib/syntax-highlighter/worker-client", () => ({
  highlighterClient: {
    highlight: vi.fn(),
  },
}));

import { highlighterClient } from "@/lib/syntax-highlighter/worker-client";

describe("useSyntaxHighlighter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return highlight function", () => {
    const { result } = renderHook(() => useSyntaxHighlighter());
    expect(result.current.highlight).toBeDefined();
    expect(typeof result.current.highlight).toBe("function");
  });

  it("should highlight code successfully", async () => {
    const mockResult = { html: "<span>highlighted</span>", error: null };
    vi.mocked(highlighterClient.highlight).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useSyntaxHighlighter());
    const highlightResult = await result.current.highlight(
      "const x = 1;",
      "typescript"
    );

    expect(highlightResult).toEqual(mockResult);
    expect(highlighterClient.highlight).toHaveBeenCalledWith(
      "const x = 1;",
      "typescript",
      "dark-plus"
    );
  });

  it("should use dark-plus theme by default", async () => {
    vi.mocked(highlighterClient.highlight).mockResolvedValue({
      html: "<span>code</span>",
      error: null,
    });

    const { result } = renderHook(() => useSyntaxHighlighter());
    await result.current.highlight("code", "javascript");

    expect(highlighterClient.highlight).toHaveBeenCalledWith(
      "code",
      "javascript",
      "dark-plus"
    );
  });

  it("should use light-plus theme when specified", async () => {
    vi.mocked(highlighterClient.highlight).mockResolvedValue({
      html: "<span>code</span>",
      error: null,
    });

    const { result } = renderHook(() => useSyntaxHighlighter());
    await result.current.highlight("code", "python", "light-plus");

    expect(highlighterClient.highlight).toHaveBeenCalledWith(
      "code",
      "python",
      "light-plus"
    );
  });

  it("should handle highlight errors", async () => {
    const mockResult = { html: null, error: "Highlight failed" };
    vi.mocked(highlighterClient.highlight).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useSyntaxHighlighter());
    const highlightResult = await result.current.highlight(
      "invalid code",
      "unknown"
    );

    expect(highlightResult).toEqual(mockResult);
  });

  it("should handle different languages", async () => {
    vi.mocked(highlighterClient.highlight).mockResolvedValue({
      html: "<span>highlighted</span>",
      error: null,
    });

    const { result } = renderHook(() => useSyntaxHighlighter());

    await result.current.highlight("print('hello')", "python");
    expect(highlighterClient.highlight).toHaveBeenCalledWith(
      "print('hello')",
      "python",
      "dark-plus"
    );

    await result.current.highlight("console.log('hello')", "javascript");
    expect(highlighterClient.highlight).toHaveBeenCalledWith(
      "console.log('hello')",
      "javascript",
      "dark-plus"
    );
  });

  it("should handle empty code", async () => {
    vi.mocked(highlighterClient.highlight).mockResolvedValue({
      html: "",
      error: null,
    });

    const { result } = renderHook(() => useSyntaxHighlighter());
    const highlightResult = await result.current.highlight("", "javascript");

    expect(highlightResult.html).toBe("");
  });

  it("should be memoized (useCallback)", () => {
    const { result, rerender } = renderHook(() => useSyntaxHighlighter());
    const firstRender = result.current.highlight;

    rerender();
    const secondRender = result.current.highlight;

    expect(firstRender).toBe(secondRender);
  });
});
