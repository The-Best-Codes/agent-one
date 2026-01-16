import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

describe("ToggleGroup Components", () => {
  describe("ToggleGroup", () => {
    it("renders correctly", () => {
      const { container } = render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      const group = container.querySelector('[data-slot="toggle-group"]');
      expect(group).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <ToggleGroup type="single" className="custom-class">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      const group = container.querySelector('[data-slot="toggle-group"]');
      expect(group).toHaveClass("custom-class");
    });

    it("renders with variant attribute", () => {
      const { container } = render(
        <ToggleGroup type="single" variant="outline">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      const group = container.querySelector('[data-slot="toggle-group"]');
      expect(group).toHaveAttribute("data-variant", "outline");
    });

    it("renders with size attribute", () => {
      const { container } = render(
        <ToggleGroup type="single" size="lg">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      const group = container.querySelector('[data-slot="toggle-group"]');
      expect(group).toHaveAttribute("data-size", "lg");
    });

    it("handles single type selection", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(
        <ToggleGroup type="single" onValueChange={handleChange}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      await user.click(screen.getByText("A"));
      expect(handleChange).toHaveBeenCalledWith("a");
    });

    it("handles multiple type selection", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(
        <ToggleGroup type="multiple" onValueChange={handleChange}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      await user.click(screen.getByText("A"));
      expect(handleChange).toHaveBeenCalledWith(["a"]);

      await user.click(screen.getByText("B"));
      expect(handleChange).toHaveBeenCalledWith(["a", "b"]);
    });

    it("forwards additional props", () => {
      const { container } = render(
        <ToggleGroup type="single" data-testid="test-group">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(container.querySelector('[data-testid="test-group"]')).toBeInTheDocument();
    });
  });

  describe("ToggleGroupItem", () => {
    it("renders correctly", () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      );
      const item = container.querySelector('[data-slot="toggle-group-item"]');
      expect(item).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" className="custom-class">Test</ToggleGroupItem>
        </ToggleGroup>
      );
      const item = container.querySelector('[data-slot="toggle-group-item"]');
      expect(item).toHaveClass("custom-class");
    });

    it("can be toggled", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      );

      const item = screen.getByText("Test");
      expect(item).toHaveAttribute("data-state", "off");

      await user.click(item);
      expect(item).toHaveAttribute("data-state", "on");
    });

    it("can be disabled", async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" disabled>Test</ToggleGroupItem>
        </ToggleGroup>
      );

      const item = screen.getByText("Test");
      expect(item).toBeDisabled();

      await user.click(item);
      expect(item).toHaveAttribute("data-state", "off");
    });

    it("inherits variant from group", () => {
      const { container } = render(
        <ToggleGroup type="single" variant="outline">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      );
      const item = container.querySelector('[data-slot="toggle-group-item"]');
      expect(item).toHaveAttribute("data-variant", "outline");
    });

    it("inherits size from group", () => {
      const { container } = render(
        <ToggleGroup type="single" size="sm">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      );
      const item = container.querySelector('[data-slot="toggle-group-item"]');
      expect(item).toHaveAttribute("data-size", "sm");
    });

    it("uses group variant when item variant not specified", () => {
      const { container } = render(
        <ToggleGroup type="single" variant="outline">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      );
      const item = container.querySelector('[data-slot="toggle-group-item"]');
      expect(item).toHaveAttribute("data-variant", "outline");
    });
  });

  describe("ToggleGroup with multiple items", () => {
    it("renders multiple items", () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B")).toBeInTheDocument();
      expect(screen.getByText("C")).toBeInTheDocument();
    });

    it("only allows single selection in single mode", async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      const itemA = screen.getByText("A");
      const itemB = screen.getByText("B");

      await user.click(itemA);
      expect(itemA).toHaveAttribute("data-state", "on");

      await user.click(itemB);
      expect(itemB).toHaveAttribute("data-state", "on");
      expect(itemA).toHaveAttribute("data-state", "off");
    });
  });
});
