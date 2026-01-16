import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessagePartFallback } from "./fallback";

describe("MessagePartFallback", () => {
  it("renders correctly", () => {
    const { container } = render(<MessagePartFallback />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("displays 'Unknown message part:' label", () => {
    const { getByText } = render(<MessagePartFallback />);
    expect(getByText("Unknown message part:")).toBeInTheDocument();
  });

  it("renders props as JSON", () => {
    const testProps = { type: "test", value: 123 };
    const { container } = render(<MessagePartFallback {...testProps} />);
    
    const pre = container.querySelector("pre");
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toBe(JSON.stringify(testProps));
  });

  it("handles complex props", () => {
    const complexProps = {
      nested: { object: { with: "values" } },
      array: [1, 2, 3],
      string: "test",
    };
    const { container } = render(<MessagePartFallback {...complexProps} />);
    
    const pre = container.querySelector("pre");
    expect(pre?.textContent).toBe(JSON.stringify(complexProps));
  });

  it("has correct styling classes", () => {
    const { container } = render(<MessagePartFallback />);
    const div = container.firstChild as HTMLElement;
    
    expect(div).toHaveClass("bg-destructive");
    expect(div).toHaveClass("text-destructive-foreground");
    expect(div).toHaveClass("flex");
    expect(div).toHaveClass("flex-col");
    expect(div).toHaveClass("rounded-md");
  });

  it("renders pre element with font-mono class", () => {
    const { container } = render(<MessagePartFallback />);
    const pre = container.querySelector("pre");
    
    expect(pre).toHaveClass("font-mono");
  });

  it("handles empty props", () => {
    const { container } = render(<MessagePartFallback />);
    const pre = container.querySelector("pre");
    expect(pre).toBeInTheDocument();
  });

  it("handles string props", () => {
    const { container } = render(<MessagePartFallback data="test-string" />);
    const pre = container.querySelector("pre");
    expect(pre?.textContent).toContain("test-string");
  });

  it("handles numeric props", () => {
    const { container } = render(<MessagePartFallback count={42} />);
    const pre = container.querySelector("pre");
    expect(pre?.textContent).toContain("42");
  });

  it("handles boolean props", () => {
    const { container } = render(<MessagePartFallback enabled={true} />);
    const pre = container.querySelector("pre");
    expect(pre?.textContent).toContain("true");
  });

  it("handles null props", () => {
    const { container } = render(<MessagePartFallback value={null} />);
    const pre = container.querySelector("pre");
    expect(pre?.textContent).toContain("null");
  });
});
