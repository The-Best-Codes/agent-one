import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "./separator";

describe("Separator", () => {
  it("renders correctly", () => {
    const { container } = render(<Separator />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toBeInTheDocument();
  });

  it("renders with horizontal orientation by default", () => {
    const { container } = render(<Separator />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders with vertical orientation", () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveAttribute("data-orientation", "vertical");
  });

  it("is decorative by default", () => {
    const { container } = render(<Separator />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveAttribute("aria-hidden", "true");
  });

  it("can be non-decorative", () => {
    const { container } = render(<Separator decorative={false} />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveAttribute("role", "separator");
  });

  it("accepts custom className", () => {
    const { container } = render(<Separator className="custom-class" />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveClass("custom-class");
  });

  it("forwards additional props", () => {
    const { container } = render(<Separator data-testid="test-separator" />);
    expect(container.querySelector('[data-testid="test-separator"]')).toBeInTheDocument();
  });
});
