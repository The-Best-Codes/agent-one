import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChevronDownIcon } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

describe("Accordion", () => {
  it("renders accordion component", () => {
    const { container } = render(
      <Accordion>
        <AccordionItem value="item1">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const accordion = container.querySelector('[data-slot="accordion"]');
    expect(accordion).toBeInTheDocument();
  });

  it("supports single type by default", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <AccordionItem value="item1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item2">
          <AccordionTrigger>Item 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await user.click(screen.getByText("Item 1"));
    expect(screen.getByText("Content 1")).toBeInTheDocument();

    await user.click(screen.getByText("Item 2"));
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("supports multiple type", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="multiple">
        <AccordionItem value="item1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item2">
          <AccordionTrigger>Item 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await user.click(screen.getByText("Item 1"));
    await user.click(screen.getByText("Item 2"));
    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("supports collapsible for single type", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await user.click(screen.getByText("Item 1"));
    expect(screen.getByText("Content 1")).toBeInTheDocument();

    await user.click(screen.getByText("Item 1"));
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
  });

  it("handles defaultValue for single type", () => {
    render(
      <Accordion defaultValue="item1">
        <AccordionItem value="item1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  it("handles defaultValue for multiple type", () => {
    render(
      <Accordion type="multiple" defaultValue={["item1", "item2"]}>
        <AccordionItem value="item1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item2">
          <AccordionTrigger>Item 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("handles controlled value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Accordion value="item1" onValueChange={onValueChange}>
        <AccordionItem value="item1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item2">
          <AccordionTrigger>Item 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.getByText("Content 1")).toBeInTheDocument();
    
    await user.click(screen.getByText("Item 2"));
    expect(onValueChange).toHaveBeenCalledWith("item2");
  });

  it("handles controlled value for multiple type", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Accordion
        type="multiple"
        value={["item1"]}
        onValueChange={onValueChange}
      >
        <AccordionItem value="item1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item2">
          <AccordionTrigger>Item 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await user.click(screen.getByText("Item 2"));
    expect(onValueChange).toHaveBeenCalledWith(["item1", "item2"]);
  });
});

describe("AccordionItem", () => {
  it("renders item", () => {
    const { container } = render(
      <Accordion>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const item = container.querySelector('[data-slot="accordion-item"]');
    expect(item).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Accordion>
        <AccordionItem value="test" className="custom-item">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const item = container.querySelector('[data-slot="accordion-item"]');
    expect(item).toHaveClass("custom-item");
  });

  it("opens when clicked", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.queryByText("Content")).not.toBeInTheDocument();
    await user.click(screen.getByText("Trigger"));
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});

describe("AccordionTrigger", () => {
  it("renders trigger", () => {
    render(
      <Accordion>
        <AccordionItem value="test">
          <AccordionTrigger>Click me</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Accordion>
        <AccordionItem value="test">
          <AccordionTrigger className="custom-trigger">Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const trigger = container.querySelector('[data-slot="accordion-trigger"]');
    expect(trigger).toHaveClass("custom-trigger");
  });

  it("shows correct state when open", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Accordion>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const trigger = container.querySelector('[data-slot="accordion-trigger"]');
    expect(trigger).toHaveAttribute("data-state", "closed");

    await user.click(screen.getByText("Trigger"));
    expect(trigger).toHaveAttribute("data-state", "open");
  });

  it("renders custom icon", () => {
    render(
      <Accordion>
        <AccordionItem value="test">
          <AccordionTrigger icon={<ChevronDownIcon />}>
            Trigger
          </AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const icon = screen.getByText("Trigger").parentElement?.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("supports icon on left", () => {
    render(
      <Accordion>
        <AccordionItem value="test">
          <AccordionTrigger icon={<ChevronDownIcon />} iconPosition="left">
            Trigger
          </AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByText("Trigger")).toBeInTheDocument();
  });

  it("supports icon rotation", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Accordion>
        <AccordionItem value="test">
          <AccordionTrigger
            icon={<ChevronDownIcon />}
            shouldRotateIcon={true}
          >
            Trigger
          </AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const trigger = container.querySelector('[data-slot="accordion-trigger"]');
    expect(trigger).toBeInTheDocument();

    await user.click(screen.getByText("Trigger"));
    expect(trigger).toHaveAttribute("data-state", "open");
  });
});

describe("AccordionContent", () => {
  it("renders content when open", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>My content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await user.click(screen.getByText("Trigger"));
    expect(screen.getByText("My content")).toBeInTheDocument();
  });

  it("applies custom className", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Accordion>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent className="custom-content">
            Content
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await user.click(screen.getByText("Trigger"));
    const content = container.querySelector(".custom-content");
    expect(content).toBeInTheDocument();
  });

  it("applies custom wrapperClassName", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Accordion>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent wrapperClassName="custom-wrapper">
            Content
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await user.click(screen.getByText("Trigger"));
    const wrapper = container.querySelector('[data-slot="accordion-content"]');
    expect(wrapper).toHaveClass("custom-wrapper");
  });

  it("handles renderWhenCollapsed prop", () => {
    const { container } = render(
      <Accordion>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent renderWhenCollapsed={true}>
            Always rendered
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const content = container.querySelector('[data-slot="accordion-content"]');
    expect(content).toBeInTheDocument();
  });
});

describe("Accordion integration", () => {
  it("renders complete accordion with multiple items", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="multiple">
        <AccordionItem value="item1">
          <AccordionTrigger icon={<ChevronDownIcon />}>
            Section 1
          </AccordionTrigger>
          <AccordionContent>Content for section 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item2">
          <AccordionTrigger icon={<ChevronDownIcon />}>
            Section 2
          </AccordionTrigger>
          <AccordionContent>Content for section 2</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item3">
          <AccordionTrigger icon={<ChevronDownIcon />}>
            Section 3
          </AccordionTrigger>
          <AccordionContent>Content for section 3</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByText("Section 2")).toBeInTheDocument();
    expect(screen.getByText("Section 3")).toBeInTheDocument();

    await user.click(screen.getByText("Section 1"));
    await user.click(screen.getByText("Section 3"));

    expect(screen.getByText("Content for section 1")).toBeInTheDocument();
    expect(screen.queryByText("Content for section 2")).not.toBeInTheDocument();
    expect(screen.getByText("Content for section 3")).toBeInTheDocument();
  });
});
