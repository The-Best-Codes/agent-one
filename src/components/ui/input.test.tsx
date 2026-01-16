import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("renders correctly", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("has correct data-slot attribute", () => {
    const { container } = render(<Input />);
    const input = container.querySelector('[data-slot="input"]');
    expect(input).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<Input className="custom-class" />);
    const input = container.querySelector('[data-slot="input"]');
    expect(input).toHaveClass("custom-class");
  });

  it("handles different input types", () => {
    const { rerender } = render(<Input type="text" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");

    rerender(<Input type="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");

    rerender(<Input type="password" />);
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toHaveAttribute("type", "password");

    rerender(<Input type="number" />);
    expect(screen.getByRole("spinbutton")).toHaveAttribute("type", "number");
  });

  it("handles user input", async () => {
    const user = userEvent.setup();
    render(<Input />);
    
    const input = screen.getByRole("textbox");
    await user.type(input, "Hello World");
    
    expect(input).toHaveValue("Hello World");
  });

  it("handles onChange event", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole("textbox");
    await user.type(input, "test");
    
    expect(handleChange).toHaveBeenCalled();
  });

  it("can be disabled", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("accepts placeholder text", () => {
    render(<Input placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
  });

  it("accepts default value", () => {
    render(<Input defaultValue="Default text" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Default text");
  });

  it("accepts controlled value", () => {
    const { rerender } = render(<Input value="Controlled" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("Controlled");

    rerender(<Input value="Updated" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("Updated");
  });

  it("forwards additional props", () => {
    render(<Input data-testid="test-input" aria-label="Test input" />);
    const input = screen.getByTestId("test-input");
    expect(input).toHaveAttribute("aria-label", "Test input");
  });

  it("supports required attribute", () => {
    render(<Input required />);
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("supports maxLength attribute", () => {
    render(<Input maxLength={10} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "10");
  });

  it("supports aria-invalid attribute", () => {
    render(<Input aria-invalid="true" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("works with id attribute for labels", () => {
    render(
      <div>
        <label htmlFor="test-input">Label</label>
        <Input id="test-input" />
      </div>
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "test-input");
  });
});
