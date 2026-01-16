import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";

describe("Command", () => {
  it("renders command component", () => {
    render(
      <Command>
        <CommandInput />
      </Command>,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Command className="custom-class" />);
    const command = screen.getByRole("combobox");
    expect(command).toHaveClass("custom-class");
  });

  it("renders with data-slot attribute", () => {
    render(<Command />);
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "data-slot",
      "command",
    );
  });
});

describe("CommandDialog", () => {
  it("renders dialog when open", () => {
    render(
      <CommandDialog open={true}>
        <CommandInput />
      </CommandDialog>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <CommandDialog open={false}>
        <CommandInput />
      </CommandDialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders with default title and description", () => {
    render(
      <CommandDialog open={true}>
        <CommandInput />
      </CommandDialog>,
    );
    expect(screen.getByText("Command Palette")).toBeInTheDocument();
    expect(
      screen.getByText("Search for a command to run..."),
    ).toBeInTheDocument();
  });

  it("renders with custom title and description", () => {
    render(
      <CommandDialog
        open={true}
        title="Custom Title"
        description="Custom description"
      >
        <CommandInput />
      </CommandDialog>,
    );
    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom description")).toBeInTheDocument();
  });

  it("renders close button by default", () => {
    render(
      <CommandDialog open={true}>
        <CommandInput />
      </CommandDialog>,
    );
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("hides close button when showCloseButton is false", () => {
    render(
      <CommandDialog open={true} showCloseButton={false}>
        <CommandInput />
      </CommandDialog>,
    );
    expect(
      screen.queryByRole("button", { name: /close/i }),
    ).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <CommandDialog open={true} className="custom-dialog">
        <CommandInput />
      </CommandDialog>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("custom-dialog");
  });
});

describe("CommandInput", () => {
  it("renders search input with icon", () => {
    render(
      <Command>
        <CommandInput placeholder="Search..." />
      </Command>,
    );
    const input = screen.getByPlaceholderText("Search...");
    expect(input).toBeInTheDocument();
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();
    render(
      <Command>
        <CommandInput placeholder="Type here" />
      </Command>,
    );
    const input = screen.getByPlaceholderText("Type here");
    await user.type(input, "test query");
    expect(input).toHaveValue("test query");
  });

  it("applies custom className", () => {
    render(
      <Command>
        <CommandInput className="custom-input" />
      </Command>,
    );
    const input = screen.getByRole("combobox");
    expect(input).toHaveClass("custom-input");
  });

  it("renders with data-slot attribute", () => {
    render(
      <Command>
        <CommandInput />
      </Command>,
    );
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "data-slot",
      "command-input",
    );
  });
});

describe("CommandList", () => {
  it("renders list of items", () => {
    render(
      <Command>
        <CommandList>
          <CommandItem>Item 1</CommandItem>
          <CommandItem>Item 2</CommandItem>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Command>
        <CommandList className="custom-list">
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>,
    );
    const list = container.querySelector('[data-slot="command-list"]');
    expect(list).toHaveClass("custom-list");
  });
});

describe("CommandEmpty", () => {
  it("renders empty state message", () => {
    render(
      <Command>
        <CommandEmpty>No results found</CommandEmpty>
      </Command>,
    );
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("has data-slot attribute", () => {
    const { container } = render(
      <Command>
        <CommandEmpty>Empty</CommandEmpty>
      </Command>,
    );
    const empty = container.querySelector('[data-slot="command-empty"]');
    expect(empty).toBeInTheDocument();
  });
});

describe("CommandGroup", () => {
  it("renders group with items", () => {
    render(
      <Command>
        <CommandGroup heading="Actions">
          <CommandItem>Action 1</CommandItem>
          <CommandItem>Action 2</CommandItem>
        </CommandGroup>
      </Command>,
    );
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Action 1")).toBeInTheDocument();
    expect(screen.getByText("Action 2")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Command>
        <CommandGroup className="custom-group">
          <CommandItem>Item</CommandItem>
        </CommandGroup>
      </Command>,
    );
    const group = container.querySelector('[data-slot="command-group"]');
    expect(group).toHaveClass("custom-group");
  });
});

describe("CommandSeparator", () => {
  it("renders separator", () => {
    const { container } = render(
      <Command>
        <CommandSeparator />
      </Command>,
    );
    const separator = container.querySelector(
      '[data-slot="command-separator"]',
    );
    expect(separator).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Command>
        <CommandSeparator className="custom-separator" />
      </Command>,
    );
    const separator = container.querySelector(
      '[data-slot="command-separator"]',
    );
    expect(separator).toHaveClass("custom-separator");
  });
});

describe("CommandItem", () => {
  it("renders clickable item", () => {
    render(
      <Command>
        <CommandItem>Click me</CommandItem>
      </Command>,
    );
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Command>
        <CommandItem className="custom-item">Item</CommandItem>
      </Command>,
    );
    const item = container.querySelector('[data-slot="command-item"]');
    expect(item).toHaveClass("custom-item");
  });

  it("handles disabled state", () => {
    const { container } = render(
      <Command>
        <CommandItem disabled>Disabled</CommandItem>
      </Command>,
    );
    const item = container.querySelector('[data-slot="command-item"]');
    expect(item).toHaveAttribute("data-disabled", "true");
  });
});

describe("CommandShortcut", () => {
  it("renders keyboard shortcut", () => {
    render(
      <Command>
        <CommandItem>
          Action
          <CommandShortcut>⌘K</CommandShortcut>
        </CommandItem>
      </Command>,
    );
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Command>
        <CommandItem>
          Action
          <CommandShortcut className="custom-shortcut">⌘K</CommandShortcut>
        </CommandItem>
      </Command>,
    );
    const shortcut = container.querySelector('[data-slot="command-shortcut"]');
    expect(shortcut).toHaveClass("custom-shortcut");
  });
});

describe("Command integration", () => {
  it("renders complete command palette", () => {
    render(
      <Command>
        <CommandInput placeholder="Search commands..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search Emoji</CommandItem>
            <CommandItem>Calculator</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>
              Profile
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem>
              Settings
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );

    expect(screen.getByPlaceholderText("Search commands...")).toBeInTheDocument();
    expect(screen.getByText("Suggestions")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("⌘P")).toBeInTheDocument();
  });
});
