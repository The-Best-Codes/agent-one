import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "./progress";

describe("Progress", () => {
  it("renders correctly", () => {
    const { container } = render(<Progress />);
    const progress = container.querySelector('[data-slot="progress"]');
    expect(progress).toBeInTheDocument();
  });

  it("has correct role attribute", () => {
    const { container } = render(<Progress />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<Progress className="custom-class" />);
    const progress = container.querySelector('[data-slot="progress"]');
    expect(progress).toHaveClass("custom-class");
  });

  it("renders with value", () => {
    const { container } = render(<Progress value={50} />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toHaveAttribute("data-value", "50");
  });

  it("renders indicator with correct transform", () => {
    const { container } = render(<Progress value={25} />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: "translateX(-75%)" });
  });

  it("handles 0% progress", () => {
    const { container } = render(<Progress value={0} />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: "translateX(-100%)" });
  });

  it("handles 100% progress", () => {
    const { container } = render(<Progress value={100} />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: "translateX(-0%)" });
  });

  it("handles undefined value", () => {
    const { container } = render(<Progress />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: "translateX(-100%)" });
  });

  it("forwards additional props", () => {
    const { container } = render(<Progress data-testid="test-progress" />);
    expect(container.querySelector('[data-testid="test-progress"]')).toBeInTheDocument();
  });

  it("supports max attribute", () => {
    const { container } = render(<Progress value={50} max={200} />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toHaveAttribute("data-max", "200");
  });

  it("renders with aria-valuemin", () => {
    const { container } = render(<Progress value={50} />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toHaveAttribute("aria-valuemin", "0");
  });

  it("renders with aria-valuemax", () => {
    const { container } = render(<Progress value={50} />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toHaveAttribute("aria-valuemax", "100");
  });

  it("renders with aria-valuenow", () => {
    const { container } = render(<Progress value={75} />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toHaveAttribute("aria-valuenow", "75");
  });
});
