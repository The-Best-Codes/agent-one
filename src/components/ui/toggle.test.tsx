import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toggle } from "./toggle";

describe("Toggle", () => {
  it("renders correctly", () => {
    render(<Toggle>Toggle</Toggle>);
    const toggle = screen.getByRole("button");
    expect(toggle).toBeInTheDocument();
  });

  it("has correct data-slot attribute", () => {
    const { container } = render(<Toggle>Toggle</Toggle>);
    const toggle = container.querySelector('[data-slot="toggle"]');
    expect(toggle).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<Toggle className="custom-class">Toggle</Toggle>);
    const toggle = container.querySelector('[data-slot="toggle"]');
    expect(toggle).toHaveClass("custom-class");
  });

  it("can be toggled", async () => {
    const user = userEvent.setup();
    render(<Toggle>Toggle</Toggle>);
    
    const toggle = screen.getByRole("button");
    expect(toggle).toHaveAttribute("data-state", "off");
    
    await user.click(toggle);
    expect(toggle).toHaveAttribute("data-state", "on");
    
    await user.click(toggle);
    expect(toggle).toHaveAttribute("data-state", "off");
  });

  it("handles onPressedChange event", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle onPressedChange={handleChange}>Toggle</Toggle>);
    
    const toggle = screen.getByRole("button");
    await user.click(toggle);
    
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("can be disabled", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle disabled onPressedChange={handleChange}>Toggle</Toggle>);
    
    const toggle = screen.getByRole("button");
    expect(toggle).toBeDisabled();
    
    await user.click(toggle);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("renders with different variants", () => {
    const { rerender } = render(<Toggle variant="default">Default</Toggle>);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Toggle variant="outline">Outline</Toggle>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with different sizes", () => {
    const { rerender } = render(<Toggle size="default">Default</Toggle>);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Toggle size="sm">Small</Toggle>);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Toggle size="lg">Large</Toggle>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("accepts controlled pressed state", () => {
    const { rerender } = render(<Toggle pressed={false}>Toggle</Toggle>);
    expect(screen.getByRole("button")).toHaveAttribute("data-state", "off");

    rerender(<Toggle pressed={true}>Toggle</Toggle>);
    expect(screen.getByRole("button")).toHaveAttribute("data-state", "on");
  });

  it("accepts default pressed state", () => {
    render(<Toggle defaultPressed={true}>Toggle</Toggle>);
    expect(screen.getByRole("button")).toHaveAttribute("data-state", "on");
  });

  it("forwards additional props", () => {
    render(<Toggle data-testid="test-toggle" aria-label="Test toggle">Toggle</Toggle>);
    const toggle = screen.getByTestId("test-toggle");
    expect(toggle).toHaveAttribute("aria-label", "Test toggle");
  });

  it("supports aria-pressed attribute", () => {
    render(<Toggle>Toggle</Toggle>);
    const toggle = screen.getByRole("button");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
