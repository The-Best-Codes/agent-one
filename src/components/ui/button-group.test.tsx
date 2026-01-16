import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./button-group";
import { Button } from "./button";

describe("ButtonGroup Components", () => {
  describe("ButtonGroup", () => {
    it("renders correctly", () => {
      render(<ButtonGroup>Content</ButtonGroup>);
      expect(screen.getByRole("group")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<ButtonGroup>Content</ButtonGroup>);
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(<ButtonGroup className="custom-class">Content</ButtonGroup>);
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveClass("custom-class");
    });

    it("renders with horizontal orientation by default", () => {
      const { container } = render(<ButtonGroup>Content</ButtonGroup>);
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveAttribute("data-orientation", "horizontal");
    });

    it("renders with vertical orientation", () => {
      const { container } = render(<ButtonGroup orientation="vertical">Content</ButtonGroup>);
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveAttribute("data-orientation", "vertical");
    });

    it("forwards additional props", () => {
      render(<ButtonGroup data-testid="test-button-group">Content</ButtonGroup>);
      expect(screen.getByTestId("test-button-group")).toBeInTheDocument();
    });

    it("renders with multiple buttons", () => {
      render(
        <ButtonGroup>
          <Button>First</Button>
          <Button>Second</Button>
          <Button>Third</Button>
        </ButtonGroup>
      );

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
    });
  });

  describe("ButtonGroupText", () => {
    it("renders correctly", () => {
      render(<ButtonGroupText>Text content</ButtonGroupText>);
      expect(screen.getByText("Text content")).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <ButtonGroupText className="custom-class">Text</ButtonGroupText>
      );
      const text = screen.getByText("Text").parentElement;
      expect(text).toHaveClass("custom-class");
    });

    it("renders as child component when asChild is true", () => {
      render(
        <ButtonGroupText asChild>
          <span data-testid="custom-element">Custom</span>
        </ButtonGroupText>
      );
      
      expect(screen.getByTestId("custom-element")).toBeInTheDocument();
    });

    it("forwards additional props", () => {
      render(<ButtonGroupText data-testid="test-text">Text</ButtonGroupText>);
      expect(screen.getByTestId("test-text")).toBeInTheDocument();
    });
  });

  describe("ButtonGroupSeparator", () => {
    it("renders correctly", () => {
      const { container } = render(<ButtonGroupSeparator />);
      const separator = container.querySelector('[data-slot="button-group-separator"]');
      expect(separator).toBeInTheDocument();
    });

    it("renders with vertical orientation by default", () => {
      const { container } = render(<ButtonGroupSeparator />);
      const separator = container.querySelector('[data-slot="button-group-separator"]');
      expect(separator).toHaveAttribute("data-orientation", "vertical");
    });

    it("renders with horizontal orientation", () => {
      const { container } = render(<ButtonGroupSeparator orientation="horizontal" />);
      const separator = container.querySelector('[data-slot="button-group-separator"]');
      expect(separator).toHaveAttribute("data-orientation", "horizontal");
    });

    it("accepts custom className", () => {
      const { container } = render(<ButtonGroupSeparator className="custom-class" />);
      const separator = container.querySelector('[data-slot="button-group-separator"]');
      expect(separator).toHaveClass("custom-class");
    });
  });

  describe("Full ButtonGroup Structure", () => {
    it("renders complete button group with all components", () => {
      render(
        <ButtonGroup>
          <Button>First</Button>
          <ButtonGroupSeparator />
          <ButtonGroupText>Label</ButtonGroupText>
          <ButtonGroupSeparator />
          <Button>Last</Button>
        </ButtonGroup>
      );

      expect(screen.getByRole("group")).toBeInTheDocument();
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Label")).toBeInTheDocument();
      expect(screen.getByText("Last")).toBeInTheDocument();
    });
  });
});
