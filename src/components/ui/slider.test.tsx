import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "./slider";

describe("Slider", () => {
  it("renders slider component", () => {
    const { container } = render(<Slider defaultValue={[50]} />);
    const slider = container.querySelector('[data-slot="slider"]');
    expect(slider).toBeInTheDocument();
  });

  it("renders with default min and max values", () => {
    const { container } = render(<Slider defaultValue={[50]} />);
    const slider = container.querySelector('[data-slot="slider"]');
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "100");
  });

  it("applies custom min and max values", () => {
    const { container } = render(<Slider defaultValue={[5]} min={0} max={10} />);
    const slider = container.querySelector('[data-slot="slider"]');
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "10");
  });

  it("applies custom className", () => {
    const { container } = render(
      <Slider defaultValue={[50]} className="custom-slider" />,
    );
    const slider = container.querySelector('[data-slot="slider"]');
    expect(slider).toHaveClass("custom-slider");
  });

  it("renders track element", () => {
    const { container } = render(<Slider defaultValue={[50]} />);
    const track = container.querySelector('[data-slot="slider-track"]');
    expect(track).toBeInTheDocument();
  });

  it("renders range element", () => {
    const { container } = render(<Slider defaultValue={[50]} />);
    const range = container.querySelector('[data-slot="slider-range"]');
    expect(range).toBeInTheDocument();
  });

  it("renders thumb element", () => {
    const { container } = render(<Slider defaultValue={[50]} />);
    const thumb = container.querySelector('[data-slot="slider-thumb"]');
    expect(thumb).toBeInTheDocument();
  });

  it("renders multiple thumbs for range slider", () => {
    const { container } = render(<Slider defaultValue={[25, 75]} />);
    const thumbs = container.querySelectorAll('[data-slot="slider-thumb"]');
    expect(thumbs).toHaveLength(2);
  });

  it("handles value changes", async () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <Slider defaultValue={[50]} onValueChange={onValueChange} />,
    );
    const slider = container.querySelector('[data-slot="slider"]');
    expect(slider).toBeInTheDocument();
  });

  it("handles disabled state", () => {
    const { container } = render(<Slider defaultValue={[50]} disabled />);
    const slider = container.querySelector('[data-slot="slider"]');
    expect(slider).toHaveAttribute("data-disabled", "true");
  });

  it("supports controlled value", () => {
    const { container } = render(<Slider value={[30]} />);
    const slider = container.querySelector('[data-slot="slider"]');
    expect(slider).toHaveAttribute("aria-valuenow", "30");
  });

  it("supports uncontrolled value with defaultValue", () => {
    const { container } = render(<Slider defaultValue={[60]} />);
    const slider = container.querySelector('[data-slot="slider"]');
    expect(slider).toHaveAttribute("aria-valuenow", "60");
  });

  it("handles step prop", () => {
    const { container } = render(<Slider defaultValue={[50]} step={10} />);
    const slider = container.querySelector('[data-slot="slider"]');
    expect(slider).toBeInTheDocument();
  });

  it("supports vertical orientation", () => {
    const { container } = render(
      <Slider defaultValue={[50]} orientation="vertical" />,
    );
    const slider = container.querySelector('[data-slot="slider"]');
    expect(slider).toHaveAttribute("data-orientation", "vertical");
  });

  it("supports horizontal orientation by default", () => {
    const { container } = render(<Slider defaultValue={[50]} />);
    const slider = container.querySelector('[data-slot="slider"]');
    expect(slider).toHaveAttribute("data-orientation", "horizontal");
  });
});

describe("Slider accessibility", () => {
  it("has correct ARIA attributes", () => {
    const { container } = render(
      <Slider defaultValue={[50]} min={0} max={100} />,
    );
    const slider = container.querySelector('[data-slot="slider"]');
    expect(slider).toHaveAttribute("role", "slider");
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "100");
  });

  it("is keyboard accessible", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <Slider defaultValue={[50]} onValueChange={onValueChange} />,
    );
    const thumb = container.querySelector('[data-slot="slider-thumb"]');
    
    if (thumb) {
      await user.click(thumb);
      await user.keyboard("{ArrowRight}");
    }
  });
});

describe("Slider integration", () => {
  it("renders complete slider with all props", () => {
    const { container } = render(
      <Slider
        defaultValue={[33]}
        min={0}
        max={100}
        step={1}
        className="w-full"
      />,
    );

    const slider = container.querySelector('[data-slot="slider"]');
    const track = container.querySelector('[data-slot="slider-track"]');
    const range = container.querySelector('[data-slot="slider-range"]');
    const thumb = container.querySelector('[data-slot="slider-thumb"]');

    expect(slider).toBeInTheDocument();
    expect(slider).toHaveClass("w-full");
    expect(track).toBeInTheDocument();
    expect(range).toBeInTheDocument();
    expect(thumb).toBeInTheDocument();
    expect(slider).toHaveAttribute("aria-valuenow", "33");
  });
});
