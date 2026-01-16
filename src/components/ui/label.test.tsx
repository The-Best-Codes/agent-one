import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./label";

describe("Label", () => {
  it("renders correctly", () => {
    render(<Label>Label text</Label>);
    expect(screen.getByText("Label text")).toBeInTheDocument();
  });

  it("has correct data-slot attribute", () => {
    const { container } = render(<Label>Label</Label>);
    const label = container.querySelector('[data-slot="label"]');
    expect(label).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<Label className="custom-class">Label</Label>);
    const label = container.querySelector('[data-slot="label"]');
    expect(label).toHaveClass("custom-class");
  });

  it("forwards htmlFor attribute", () => {
    render(<Label htmlFor="input-id">Input Label</Label>);
    const label = screen.getByText("Input Label");
    expect(label).toHaveAttribute("for", "input-id");
  });

  it("forwards additional props", () => {
    render(<Label data-testid="test-label">Test</Label>);
    expect(screen.getByTestId("test-label")).toBeInTheDocument();
  });

  it("works with form inputs", () => {
    render(
      <div>
        <Label htmlFor="email">Email</Label>
        <input id="email" type="email" />
      </div>
    );

    const label = screen.getByText("Email");
    const input = screen.getByRole("textbox");
    
    expect(label).toHaveAttribute("for", "email");
    expect(input).toHaveAttribute("id", "email");
  });
});
