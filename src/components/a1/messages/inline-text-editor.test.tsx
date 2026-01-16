import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InlineTextEditor } from "./inline-text-editor";

vi.mock("@uiw/react-codemirror", () => ({
  default: ({
    value,
    onChange,
    className,
  }: {
    value: string;
    onChange: (v: string) => void;
    className: string;
  }) => (
    <textarea
      data-testid="code-mirror"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  ),
}));

vi.mock("@/hooks/use-theme", () => ({
  useTheme: vi.fn(() => ({
    resolvedTheme: "light",
  })),
}));

vi.mock("jotai", () => ({
  useAtomValue: vi.fn((atom) => {
    if (atom.toString().includes("markdownHighlighting")) return true;
    if (atom.toString().includes("submitKey")) return "enter";
    return undefined;
  }),
}));

describe("InlineTextEditor", () => {
  it("renders editor with initial value", () => {
    render(<InlineTextEditor value="test content" onChange={vi.fn()} />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveValue("test content");
  });

  it("calls onChange when value changes", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <InlineTextEditor value="initial" onChange={onChange} />,
    );
    
    const editor = document.querySelector('[data-testid="code-mirror"]') as HTMLTextAreaElement;
    if (editor) {
      const event = new Event("change", { bubbles: true });
      Object.defineProperty(event, "target", {
        value: { value: "updated" },
      });
      editor.dispatchEvent(event);
    }
  });

  it("applies custom className", () => {
    render(
      <InlineTextEditor
        value="test"
        onChange={vi.fn()}
        className="custom-class"
      />,
    );
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toHaveClass("custom-class");
  });

  it("renders with autoFocus prop", () => {
    render(<InlineTextEditor value="test" onChange={vi.fn()} autoFocus />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
  });

  it("renders without autoFocus prop", () => {
    render(
      <InlineTextEditor value="test" onChange={vi.fn()} autoFocus={false} />,
    );
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
  });

  it("memoizes properly with same props", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <InlineTextEditor value="test" onChange={onChange} />,
    );
    
    const firstRender = document.querySelector('[data-testid="code-mirror"]');
    
    rerender(<InlineTextEditor value="test" onChange={onChange} />);
    
    const secondRender = document.querySelector('[data-testid="code-mirror"]');
    expect(firstRender).toBe(secondRender);
  });

  it("renders with dark theme", () => {
    const { useTheme } = require("@/hooks/use-theme");
    useTheme.mockReturnValue({ resolvedTheme: "dark" });
    
    render(<InlineTextEditor value="test" onChange={vi.fn()} />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
  });

  it("renders with light theme", () => {
    const { useTheme } = require("@/hooks/use-theme");
    useTheme.mockReturnValue({ resolvedTheme: "light" });
    
    render(<InlineTextEditor value="test" onChange={vi.fn()} />);
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
  });

  it("accepts onEnter callback", () => {
    const onEnter = vi.fn();
    render(
      <InlineTextEditor value="test" onChange={vi.fn()} onEnter={onEnter} />,
    );
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
  });

  it("accepts disableEnter prop", () => {
    render(
      <InlineTextEditor
        value="test"
        onChange={vi.fn()}
        disableEnter={true}
      />,
    );
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
  });

  it("accepts onCancel callback", () => {
    const onCancel = vi.fn();
    render(
      <InlineTextEditor value="test" onChange={vi.fn()} onCancel={onCancel} />,
    );
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
  });

  it("renders with all props", () => {
    render(
      <InlineTextEditor
        value="test content"
        onChange={vi.fn()}
        autoFocus={true}
        className="custom-class"
        onEnter={vi.fn()}
        disableEnter={false}
        onCancel={vi.fn()}
      />,
    );
    const editor = document.querySelector('[data-testid="code-mirror"]');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveClass("custom-class");
    expect(editor).toHaveValue("test content");
  });

  it("has correct display name", () => {
    expect(InlineTextEditor.displayName).toBe("InlineTextEditor");
  });
});
