import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CopyButton } from "./copy-button";

vi.mock("@tauri-apps/plugin-clipboard-manager", () => ({
  writeText: vi.fn(),
}));

import { writeText as mockWriteText } from "@tauri-apps/plugin-clipboard-manager";

describe("CopyButton", () => {
  beforeEach(() => {
    mockWriteText.mockClear();
  });

  it("renders correctly", () => {
    render(<CopyButton text="Test text" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has cursor-copy class", () => {
    render(<CopyButton text="Test text" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("cursor-copy");
  });

  it("shows copy icon in idle state", () => {
    const { container } = render(<CopyButton text="Test text" />);
    const copyIcon = container.querySelector("svg");
    expect(copyIcon).toBeInTheDocument();
  });

  it("handles copy click", async () => {
    mockWriteText.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CopyButton text="Test text" />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(mockWriteText).toHaveBeenCalledWith("Test text");
  });

  it("shows success state after successful copy", async () => {
    mockWriteText.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CopyButton text="Test text" disabledDuration={100} />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it("shows error state after failed copy", async () => {
    mockWriteText.mockRejectedValue(new Error("Copy failed"));
    const user = userEvent.setup();
    render(<CopyButton text="Test text" disabledDuration={100} />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it("returns to idle state after timeout", async () => {
    mockWriteText.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CopyButton text="Test text" disabledDuration={100} />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    await waitFor(
      () => {
        expect(button).not.toBeDisabled();
      },
      { timeout: 200 }
    );
  });

  it("accepts custom className", () => {
    render(<CopyButton text="Test text" className="custom-class" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("accepts custom size", () => {
    render(<CopyButton text="Test text" size="sm" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("uses custom variants", async () => {
    mockWriteText.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <CopyButton
        text="Test text"
        variants={{
          idle: "outline",
          copying: "ghost",
          success: "default",
          error: "destructive",
        }}
      />
    );

    const button = screen.getByRole("button");
    await user.click(button);

    expect(mockWriteText).toHaveBeenCalled();
  });

  it("forwards additional props", () => {
    render(<CopyButton text="Test text" data-testid="test-copy-button" />);
    expect(screen.getByTestId("test-copy-button")).toBeInTheDocument();
  });

  it("prevents multiple clicks while copying", async () => {
    mockWriteText.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    const user = userEvent.setup();
    render(<CopyButton text="Test text" />);

    const button = screen.getByRole("button");
    await user.click(button);
    
    expect(button).toBeDisabled();
    
    await user.click(button);
    
    expect(mockWriteText).toHaveBeenCalledTimes(1);
  });

  it("accepts aria-label", () => {
    render(<CopyButton text="Test text" aria-label="Copy to clipboard" />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Copy to clipboard");
  });
});
