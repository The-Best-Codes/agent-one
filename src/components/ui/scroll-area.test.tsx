import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollArea, ScrollBar } from "./scroll-area";

describe("ScrollArea", () => {
  it("renders scroll area with content", () => {
    render(
      <ScrollArea>
        <div>Scrollable Content</div>
      </ScrollArea>,
    );
    expect(screen.getByText("Scrollable Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ScrollArea className="custom-scroll">
        <div>Content</div>
      </ScrollArea>,
    );
    const scrollArea = container.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea).toHaveClass("custom-scroll");
  });

  it("applies custom viewportClassName", () => {
    const { container } = render(
      <ScrollArea viewportClassName="custom-viewport">
        <div>Content</div>
      </ScrollArea>,
    );
    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport).toHaveClass("custom-viewport");
  });

  it("has correct data-slot attribute", () => {
    const { container } = render(
      <ScrollArea>
        <div>Content</div>
      </ScrollArea>,
    );
    expect(container.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument();
  });

  it("renders viewport with content", () => {
    const { container } = render(
      <ScrollArea>
        <div>Viewport Content</div>
      </ScrollArea>,
    );
    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport).toBeInTheDocument();
    expect(viewport).toHaveTextContent("Viewport Content");
  });

  it("renders with scrollbar by default", () => {
    const { container } = render(
      <ScrollArea>
        <div>Content</div>
      </ScrollArea>,
    );
    const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
    expect(scrollbar).toBeInTheDocument();
  });
});

describe("ScrollBar", () => {
  it("renders vertical scrollbar by default", () => {
    const { container } = render(<ScrollBar />);
    const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
    expect(scrollbar).toHaveAttribute("data-orientation", "vertical");
  });

  it("renders horizontal scrollbar", () => {
    const { container } = render(<ScrollBar orientation="horizontal" />);
    const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
    expect(scrollbar).toHaveAttribute("data-orientation", "horizontal");
  });

  it("applies custom className", () => {
    const { container } = render(<ScrollBar className="custom-scrollbar" />);
    const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]');
    expect(scrollbar).toHaveClass("custom-scrollbar");
  });

  it("renders scrollbar thumb", () => {
    const { container } = render(<ScrollBar />);
    const thumb = container.querySelector('[data-slot="scroll-area-thumb"]');
    expect(thumb).toBeInTheDocument();
  });

  it("has correct data-slot attribute", () => {
    const { container } = render(<ScrollBar />);
    expect(container.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeInTheDocument();
  });
});

describe("ScrollArea integration", () => {
  it("renders complete scroll area with long content", () => {
    const { container } = render(
      <ScrollArea className="h-72 w-48">
        <div>
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i}>Item {i + 1}</div>
          ))}
        </div>
      </ScrollArea>,
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 50")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="scroll-area"]')).toHaveClass("h-72", "w-48");
  });

  it("renders with custom viewport styling", () => {
    const { container } = render(
      <ScrollArea viewportClassName="p-4">
        <div>Content with padding</div>
      </ScrollArea>,
    );
    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport).toHaveClass("p-4");
  });
});
