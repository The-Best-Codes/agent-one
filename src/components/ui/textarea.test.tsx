import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("renders correctly", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("has correct data-slot attribute", () => {
    const { container } = render(<Textarea />);
    const textarea = container.querySelector('[data-slot="textarea"]');
    expect(textarea).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<Textarea className="custom-class" />);
    const textarea = container.querySelector('[data-slot="textarea"]');
    expect(textarea).toHaveClass("custom-class");
  });

  it("handles user input", async () => {
    const user = userEvent.setup();
    render(<Textarea />);
    
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Hello World");
    
    expect(textarea).toHaveValue("Hello World");
  });

  it("handles onChange event", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Textarea onChange={handleChange} />);
    
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "test");
    
    expect(handleChange).toHaveBeenCalled();
  });

  it("can be disabled", () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
  });

  it("accepts placeholder text", () => {
    render(<Textarea placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
  });

  it("accepts default value", () => {
    render(<Textarea defaultValue="Default text" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Default text");
  });

  it("accepts controlled value", () => {
    const { rerender } = render(<Textarea value="Controlled" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("Controlled");

    rerender(<Textarea value="Updated" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("Updated");
  });

  it("forwards additional props", () => {
    render(<Textarea data-testid="test-textarea" aria-label="Test textarea" />);
    const textarea = screen.getByTestId("test-textarea");
    expect(textarea).toHaveAttribute("aria-label", "Test textarea");
  });

  it("supports required attribute", () => {
    render(<Textarea required />);
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("supports rows attribute", () => {
    render(<Textarea rows={5} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "5");
  });

  it("supports maxLength attribute", () => {
    render(<Textarea maxLength={100} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "100");
  });

  it("supports aria-invalid attribute", () => {
    render(<Textarea aria-invalid="true" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("handles multi-line input", async () => {
    const user = userEvent.setup();
    render(<Textarea />);
    
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Line 1{Enter}Line 2{Enter}Line 3");
    
    expect(textarea).toHaveValue("Line 1\nLine 2\nLine 3");
  });
});
