import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("renders correctly", () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
  });

  it("has correct data-slot attribute", () => {
    const { container } = render(<Checkbox />);
    const checkbox = container.querySelector('[data-slot="checkbox"]');
    expect(checkbox).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<Checkbox className="custom-class" />);
    const checkbox = container.querySelector('[data-slot="checkbox"]');
    expect(checkbox).toHaveClass("custom-class");
  });

  it("can be checked", async () => {
    const user = userEvent.setup();
    render(<Checkbox />);
    
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
    
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("handles onCheckedChange event", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox onCheckedChange={handleChange} />);
    
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("can be disabled", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox disabled onCheckedChange={handleChange} />);
    
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
    
    await user.click(checkbox);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("accepts controlled checked state", () => {
    const { rerender } = render(<Checkbox checked={false} />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();

    rerender(<Checkbox checked={true} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("accepts default checked state", () => {
    render(<Checkbox defaultChecked={true} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("forwards additional props", () => {
    render(<Checkbox data-testid="test-checkbox" aria-label="Test checkbox" />);
    const checkbox = screen.getByTestId("test-checkbox");
    expect(checkbox).toHaveAttribute("aria-label", "Test checkbox");
  });

  it("supports required attribute", () => {
    render(<Checkbox required />);
    expect(screen.getByRole("checkbox")).toBeRequired();
  });

  it("supports aria-invalid attribute", () => {
    render(<Checkbox aria-invalid="true" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("renders indicator when checked", async () => {
    const user = userEvent.setup();
    const { container } = render(<Checkbox />);
    
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    
    const indicator = container.querySelector('[data-slot="checkbox-indicator"]');
    expect(indicator).toBeInTheDocument();
  });

  it("works with labels", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <label htmlFor="terms">Accept terms</label>
        <Checkbox id="terms" />
      </div>
    );

    const checkbox = screen.getByRole("checkbox");
    const label = screen.getByText("Accept terms");
    
    await user.click(label);
    expect(checkbox).toBeChecked();
  });
});
