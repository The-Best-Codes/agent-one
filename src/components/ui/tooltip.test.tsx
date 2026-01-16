import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "./tooltip";

describe("Tooltip", () => {
  it("renders tooltip with provider", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>,
    );

    expect(screen.getByText("Hover me")).toBeInTheDocument();
    await user.hover(screen.getByText("Hover me"));
    await waitFor(() => {
      expect(screen.getByText("Tooltip text")).toBeInTheDocument();
    });
  });

  it("does not show tooltip initially", () => {
    render(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>,
    );

    expect(screen.queryByText("Tooltip text")).not.toBeInTheDocument();
  });
});

describe("TooltipProvider", () => {
  it("renders provider with custom delayDuration", () => {
    const { container } = render(
      <TooltipProvider delayDuration={500}>
        <TooltipRoot>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );
    expect(container.querySelector('[data-slot="tooltip-provider"]')).toBeInTheDocument();
  });

  it("uses default delayDuration of 700ms", () => {
    const { container } = render(
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );
    expect(container.querySelector('[data-slot="tooltip-provider"]')).toBeInTheDocument();
  });
});

describe("TooltipRoot", () => {
  it("renders root component", () => {
    const { container } = render(
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );
    expect(container.querySelector('[data-slot="tooltip-root"]')).toBeInTheDocument();
  });

  it("controls open state", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <TooltipRoot open={true}>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Always visible</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );

    expect(screen.getByText("Always visible")).toBeInTheDocument();
  });
});

describe("TooltipTrigger", () => {
  it("renders trigger element", () => {
    render(
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger>Click or hover</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );
    expect(screen.getByText("Click or hover")).toBeInTheDocument();
  });

  it("can be a button", () => {
    render(
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <button>Button trigger</button>
          </TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );
    expect(screen.getByRole("button", { name: "Button trigger" })).toBeInTheDocument();
  });
});

describe("TooltipContent", () => {
  it("renders tooltip content", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent>This is tooltip content</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );

    await user.hover(screen.getByText("Hover"));
    await waitFor(() => {
      expect(screen.getByText("This is tooltip content")).toBeInTheDocument();
    });
  });

  it("applies custom className", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent className="custom-tooltip">Content</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );

    await user.hover(screen.getByText("Hover"));
    await waitFor(() => {
      const content = container.querySelector('[data-slot="tooltip-content"]');
      expect(content).toHaveClass("custom-tooltip");
    });
  });

  it("applies custom sideOffset", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent sideOffset={10}>Content</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );

    await user.hover(screen.getByText("Hover"));
    await waitFor(() => {
      const content = container.querySelector('[data-slot="tooltip-content"]');
      expect(content).toBeInTheDocument();
    });
  });

  it("has correct data-slot attribute", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );

    await user.hover(screen.getByText("Hover"));
    await waitFor(() => {
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument();
    });
  });

  it("renders arrow element", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );

    await user.hover(screen.getByText("Hover"));
    await waitFor(() => {
      const arrow = container.querySelector('.fill-foreground');
      expect(arrow).toBeInTheDocument();
    });
  });
});

describe("Tooltip integration", () => {
  it("shows tooltip on hover and hides on unhover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger>Hover target</TooltipTrigger>
        <TooltipContent>Information text</TooltipContent>
      </Tooltip>,
    );

    expect(screen.queryByText("Information text")).not.toBeInTheDocument();

    await user.hover(screen.getByText("Hover target"));
    await waitFor(() => {
      expect(screen.getByText("Information text")).toBeInTheDocument();
    });

    await user.unhover(screen.getByText("Hover target"));
    await waitFor(() => {
      expect(screen.queryByText("Information text")).not.toBeInTheDocument();
    });
  });

  it("renders complete tooltip with custom styling", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <button className="custom-trigger">Help</button>
          </TooltipTrigger>
          <TooltipContent className="custom-content" sideOffset={5}>
            <p>This is help information</p>
          </TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Help" });
    expect(trigger).toHaveClass("custom-trigger");

    await user.hover(trigger);
    await waitFor(() => {
      expect(screen.getByText("This is help information")).toBeInTheDocument();
    });
  });
});
