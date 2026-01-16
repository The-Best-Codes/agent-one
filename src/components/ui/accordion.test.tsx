import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

describe("Accordion Components", () => {
  describe("Accordion", () => {
    it("renders correctly", () => {
      const { container } = render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const accordion = container.querySelector('[data-slot="accordion"]');
      expect(accordion).toBeInTheDocument();
    });

    it("supports single type", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      expect(screen.getByText("Item")).toBeInTheDocument();
    });

    it("supports multiple type", () => {
      render(
        <Accordion type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("is collapsible", () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      expect(screen.getByText("Item")).toBeInTheDocument();
    });
  });

  describe("AccordionItem", () => {
    it("renders correctly", () => {
      const { container } = render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const item = container.querySelector('[data-slot="accordion-item"]');
      expect(item).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <Accordion type="single">
          <AccordionItem value="item-1" className="custom-class">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const item = container.querySelector('[data-slot="accordion-item"]');
      expect(item).toHaveClass("custom-class");
    });
  });

  describe("AccordionTrigger", () => {
    it("renders correctly", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger Text</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      expect(screen.getByText("Trigger Text")).toBeInTheDocument();
    });

    it("is a button", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const trigger = container.querySelector('[data-slot="accordion-trigger"]');
      expect(trigger).toBeInTheDocument();
    });

    it("toggles content on click", async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Hidden Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const trigger = screen.getByRole("button");
      
      await user.click(trigger);
      expect(trigger).toHaveAttribute("data-state", "open");
      
      await user.click(trigger);
      expect(trigger).toHaveAttribute("data-state", "closed");
    });

    it("renders chevron icon", () => {
      const { container } = render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger className="custom-class">Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const trigger = container.querySelector('[data-slot="accordion-trigger"]');
      expect(trigger).toHaveClass("custom-class");
    });
  });

  describe("AccordionContent", () => {
    it("renders correctly", async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content Text</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      await user.click(screen.getByRole("button"));
      expect(screen.getByText("Content Text")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      await user.click(screen.getByRole("button"));
      
      const content = container.querySelector('[data-slot="accordion-content"]');
      expect(content).toBeInTheDocument();
    });

    it("accepts custom className", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent className="custom-class">Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      await user.click(screen.getByRole("button"));
      
      const contentWrapper = container.querySelector(".custom-class");
      expect(contentWrapper).toBeInTheDocument();
    });

    it("is hidden when closed", () => {
      const { container } = render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const content = container.querySelector('[data-slot="accordion-content"]');
      expect(content).toHaveAttribute("data-state", "closed");
    });

    it("is visible when open", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      await user.click(screen.getByRole("button"));
      
      const content = container.querySelector('[data-slot="accordion-content"]');
      expect(content).toHaveAttribute("data-state", "open");
    });
  });

  describe("Complete Accordion", () => {
    it("renders multiple items", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Item 3</AccordionTrigger>
            <AccordionContent>Content 3</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      expect(screen.getByText("Item 3")).toBeInTheDocument();
    });

    it("only allows one open in single mode", async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const buttons = screen.getAllByRole("button");
      
      await user.click(buttons[0]);
      expect(buttons[0]).toHaveAttribute("data-state", "open");
      
      await user.click(buttons[1]);
      expect(buttons[0]).toHaveAttribute("data-state", "closed");
      expect(buttons[1]).toHaveAttribute("data-state", "open");
    });
  });
});
