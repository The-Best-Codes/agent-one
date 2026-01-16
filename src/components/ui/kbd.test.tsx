import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Kbd, KbdGroup } from "./kbd";

describe("Kbd Components", () => {
  describe("Kbd", () => {
    it("renders correctly", () => {
      render(<Kbd>Ctrl</Kbd>);
      expect(screen.getByText("Ctrl")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<Kbd>Key</Kbd>);
      const kbd = container.querySelector('[data-slot="kbd"]');
      expect(kbd).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(<Kbd className="custom-class">Key</Kbd>);
      const kbd = container.querySelector('[data-slot="kbd"]');
      expect(kbd).toHaveClass("custom-class");
    });

    it("forwards additional props", () => {
      render(<Kbd data-testid="test-kbd">Key</Kbd>);
      expect(screen.getByTestId("test-kbd")).toBeInTheDocument();
    });

    it("renders as kbd element", () => {
      const { container } = render(<Kbd>Key</Kbd>);
      const kbd = container.querySelector("kbd");
      expect(kbd).toBeInTheDocument();
    });

    it("renders with icon", () => {
      render(
        <Kbd>
          <svg data-testid="kbd-icon" />
          Ctrl
        </Kbd>
      );
      expect(screen.getByTestId("kbd-icon")).toBeInTheDocument();
      expect(screen.getByText("Ctrl")).toBeInTheDocument();
    });
  });

  describe("KbdGroup", () => {
    it("renders correctly", () => {
      render(<KbdGroup>Group content</KbdGroup>);
      expect(screen.getByText("Group content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<KbdGroup>Group</KbdGroup>);
      const group = container.querySelector('[data-slot="kbd-group"]');
      expect(group).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(<KbdGroup className="custom-class">Group</KbdGroup>);
      const group = container.querySelector('[data-slot="kbd-group"]');
      expect(group).toHaveClass("custom-class");
    });

    it("renders multiple kbd elements inside group", () => {
      const { container } = render(
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <span>+</span>
          <Kbd>K</Kbd>
        </KbdGroup>
      );

      const kbds = container.querySelectorAll('[data-slot="kbd"]');
      expect(kbds).toHaveLength(2);
      expect(screen.getByText("Ctrl")).toBeInTheDocument();
      expect(screen.getByText("K")).toBeInTheDocument();
      expect(screen.getByText("+")).toBeInTheDocument();
    });

    it("renders as kbd element", () => {
      const { container } = render(<KbdGroup>Group</KbdGroup>);
      const group = container.querySelector("kbd[data-slot='kbd-group']");
      expect(group).toBeInTheDocument();
    });
  });
});
