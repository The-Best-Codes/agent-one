import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "./popover";

describe("Popover", () => {
  it("renders popover component", () => {
    render(
      <Popover open={true}>
        <PopoverContent>Popover Content</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText("Popover Content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Popover open={false}>
        <PopoverContent>Popover Content</PopoverContent>
      </Popover>,
    );
    expect(screen.queryByText("Popover Content")).not.toBeInTheDocument();
  });

  it("opens on trigger click", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByText("Open"));
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});

describe("PopoverTrigger", () => {
  it("renders trigger element", () => {
    render(
      <Popover>
        <PopoverTrigger>Click Me</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });
});

describe("PopoverContent", () => {
  it("renders content when open", () => {
    render(
      <Popover open={true}>
        <PopoverContent>My Popover Content</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText("My Popover Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Popover open={true}>
        <PopoverContent className="custom-popover">Content</PopoverContent>
      </Popover>,
    );
    const content = container.querySelector('[data-slot="popover-content"]');
    expect(content).toHaveClass("custom-popover");
  });

  it("applies custom align prop", () => {
    const { container } = render(
      <Popover open={true}>
        <PopoverContent align="start">Content</PopoverContent>
      </Popover>,
    );
    const content = container.querySelector('[data-slot="popover-content"]');
    expect(content).toBeInTheDocument();
  });

  it("applies custom sideOffset", () => {
    const { container } = render(
      <Popover open={true}>
        <PopoverContent sideOffset={10}>Content</PopoverContent>
      </Popover>,
    );
    const content = container.querySelector('[data-slot="popover-content"]');
    expect(content).toBeInTheDocument();
  });

  it("has correct data-slot attribute", () => {
    const { container } = render(
      <Popover open={true}>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );
    expect(container.querySelector('[data-slot="popover-content"]')).toBeInTheDocument();
  });
});

describe("PopoverAnchor", () => {
  it("renders anchor element", () => {
    const { container } = render(
      <Popover open={true}>
        <PopoverAnchor>
          <button>Anchor</button>
        </PopoverAnchor>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );
    expect(screen.getByRole("button", { name: "Anchor" })).toBeInTheDocument();
    const anchor = container.querySelector('[data-slot="popover-anchor"]');
    expect(anchor).toBeInTheDocument();
  });
});

describe("Popover integration", () => {
  it("renders complete popover with trigger and content", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Show Info</PopoverTrigger>
        <PopoverContent>
          <div>
            <h3>Information</h3>
            <p>This is popover content</p>
          </div>
        </PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText("Information")).not.toBeInTheDocument();
    await user.click(screen.getByText("Show Info"));
    expect(screen.getByText("Information")).toBeInTheDocument();
    expect(screen.getByText("This is popover content")).toBeInTheDocument();
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Popover Content</PopoverContent>
        </Popover>
        <button>Outside</button>
      </div>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByText("Popover Content")).toBeInTheDocument();
    
    await user.click(screen.getByText("Outside"));
    expect(screen.queryByText("Popover Content")).not.toBeInTheDocument();
  });
});
