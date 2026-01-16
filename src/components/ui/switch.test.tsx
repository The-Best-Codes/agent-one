import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
  it("renders correctly", () => {
    render(<Switch />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeInTheDocument();
  });

  it("has correct data-slot attribute", () => {
    const { container } = render(<Switch />);
    const switchElement = container.querySelector('[data-slot="switch"]');
    expect(switchElement).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<Switch className="custom-class" />);
    const switchElement = container.querySelector('[data-slot="switch"]');
    expect(switchElement).toHaveClass("custom-class");
  });

  it("can be toggled", async () => {
    const user = userEvent.setup();
    render(<Switch />);
    
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "unchecked");
    
    await user.click(switchElement);
    expect(switchElement).toHaveAttribute("data-state", "checked");
  });

  it("handles onCheckedChange event", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch onCheckedChange={handleChange} />);
    
    const switchElement = screen.getByRole("switch");
    await user.click(switchElement);
    
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("can be disabled", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch disabled onCheckedChange={handleChange} />);
    
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeDisabled();
    
    await user.click(switchElement);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("accepts controlled checked state", () => {
    const { rerender } = render(<Switch checked={false} />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "unchecked");

    rerender(<Switch checked={true} />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "checked");
  });

  it("accepts default checked state", () => {
    render(<Switch defaultChecked={true} />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "checked");
  });

  it("forwards additional props", () => {
    render(<Switch data-testid="test-switch" aria-label="Test switch" />);
    const switchElement = screen.getByTestId("test-switch");
    expect(switchElement).toHaveAttribute("aria-label", "Test switch");
  });

  it("supports required attribute", () => {
    render(<Switch required />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-required", "true");
  });

  it("renders thumb element", () => {
    const { container } = render(<Switch />);
    const thumb = container.querySelector('[data-slot="switch-thumb"]');
    expect(thumb).toBeInTheDocument();
  });

  it("works with labels", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <label htmlFor="notifications">Enable notifications</label>
        <Switch id="notifications" />
      </div>
    );

    const switchElement = screen.getByRole("switch");
    const label = screen.getByText("Enable notifications");
    
    await user.click(label);
    expect(switchElement).toHaveAttribute("data-state", "checked");
  });
});
