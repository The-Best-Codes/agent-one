import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PerformantMarkdown } from "./performant-markdown";

vi.mock("@uiw/react-codemirror", () => ({
  default: ({ value, className, maxHeight, readOnly }: any) => (
    <div
      data-testid="code-mirror"
      data-readonly={readOnly}
      data-max-height={maxHeight}
      className={className}
    >
      {value}
    </div>
  ),
}));

vi.mock("@/hooks/use-theme", () => ({
  useTheme: vi.fn(() => ({
    resolvedTheme: "light",
  })),
}));

vi.mock("jotai", () => ({
  useAtomValue: vi.fn(() => true),
}));

describe("PerformantMarkdown", () => {
  it("renders markdown content", () => {
    render(<PerformantMarkdown content="# Hello World" />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveTextContent("# Hello World");
  });

  it("renders with empty content", () => {
    render(<PerformantMarkdown content="" />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveTextContent("No content detected to display");
  });

  it("applies default max height", () => {
    render(<PerformantMarkdown content="Test content" />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toHaveAttribute("data-max-height", "384px");
  });

  it("applies custom max height", () => {
    render(<PerformantMarkdown content="Test content" maxHeight="500px" />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toHaveAttribute("data-max-height", "500px");
  });

  it("is read-only", () => {
    render(<PerformantMarkdown content="Test content" />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toHaveAttribute("data-readonly", "true");
  });

  it("applies correct className", () => {
    render(<PerformantMarkdown content="Test content" />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toHaveClass("w-full", "bg-transparent", "text-sm");
  });

  it("renders with dark theme", () => {
    const { useTheme } = require("@/hooks/use-theme");
    useTheme.mockReturnValue({ resolvedTheme: "dark" });
    
    render(<PerformantMarkdown content="Test content" />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
  });

  it("renders with light theme", () => {
    const { useTheme } = require("@/hooks/use-theme");
    useTheme.mockReturnValue({ resolvedTheme: "light" });
    
    render(<PerformantMarkdown content="Test content" />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
  });

  it("wraps content in overflow container", () => {
    const { container } = render(<PerformantMarkdown content="Test" />);
    const wrapper = container.querySelector(".overflow-hidden");
    expect(wrapper).toBeInTheDocument();
  });

  it("has correct display name", () => {
    expect(PerformantMarkdown.displayName).toBe("PerformantMarkdown");
  });

  it("renders long content", () => {
    const longContent = "Line\n".repeat(100);
    render(<PerformantMarkdown content={longContent} />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
  });

  it("handles markdown formatting in content", () => {
    const markdown = `# Heading
## Subheading
- List item 1
- List item 2
**Bold text**
*Italic text*`;
    
    render(<PerformantMarkdown content={markdown} />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toHaveTextContent("# Heading");
    expect(editor).toHaveTextContent("- List item 1");
  });

  it("memoizes properly", () => {
    const { rerender } = render(
      <PerformantMarkdown content="Test content" />,
    );
    const firstRender = document.querySelector('[data-testid="code-mirror"]');
    
    rerender(<PerformantMarkdown content="Test content" />);
    const secondRender = document.querySelector('[data-testid="code-mirror"]');
    
    expect(firstRender).toBe(secondRender);
  });
});
