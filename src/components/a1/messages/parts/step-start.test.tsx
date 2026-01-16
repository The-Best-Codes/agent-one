import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessagePartStepStart } from "./step-start";

describe("MessagePartStepStart", () => {
  it("renders nothing", () => {
    const { container } = render(<MessagePartStepStart />);
    expect(container.firstChild).toBeNull();
  });

  it("is unused component", () => {
    const result = render(<MessagePartStepStart />);
    expect(result.container).toBeInTheDocument();
  });
});
