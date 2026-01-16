import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders correctly", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toHaveClass("custom-class");
  });

  it("forwards additional props", () => {
    const { container } = render(<Skeleton data-testid="test-skeleton" />);
    expect(container.querySelector('[data-testid="test-skeleton"]')).toBeInTheDocument();
  });

  it("can be used with custom dimensions", () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toHaveClass("h-4", "w-full");
  });

  it("renders multiple skeletons", () => {
    const { container } = render(
      <div>
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
      </div>
    );
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons).toHaveLength(3);
  });
});
