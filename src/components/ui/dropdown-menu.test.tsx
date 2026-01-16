import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

describe("DropdownMenu", () => {
  it("renders dropdown menu", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("Item")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <DropdownMenu open={false}>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.queryByText("Item")).not.toBeInTheDocument();
  });

  it("opens on trigger click", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByText("Open Menu"));
    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });
});

describe("DropdownMenuTrigger", () => {
  it("renders trigger button", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Click Me</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });
});

describe("DropdownMenuContent", () => {
  it("renders menu content", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuItem>Content Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("Content Item")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <DropdownMenu open={true}>
        <DropdownMenuContent className="custom-content">
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const content = container.querySelector('[data-slot="dropdown-menu-content"]');
    expect(content).toHaveClass("custom-content");
  });

  it("applies custom sideOffset", () => {
    const { container } = render(
      <DropdownMenu open={true}>
        <DropdownMenuContent sideOffset={10}>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const content = container.querySelector('[data-slot="dropdown-menu-content"]');
    expect(content).toBeInTheDocument();
  });
});

describe("DropdownMenuItem", () => {
  it("renders menu item", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuItem>My Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("My Item")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuItem className="custom-item">Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = container.querySelector('[data-slot="dropdown-menu-item"]');
    expect(item).toHaveClass("custom-item");
  });

  it("handles inset prop", () => {
    const { container } = render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = container.querySelector('[data-slot="dropdown-menu-item"]');
    expect(item).toHaveAttribute("data-inset", "true");
  });

  it("handles destructive variant", () => {
    const { container } = render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = container.querySelector('[data-slot="dropdown-menu-item"]');
    expect(item).toHaveAttribute("data-variant", "destructive");
  });

  it("handles disabled state", () => {
    const { container } = render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = container.querySelector('[data-slot="dropdown-menu-item"]');
    expect(item).toHaveAttribute("data-disabled");
  });
});

describe("DropdownMenuCheckboxItem", () => {
  it("renders checkbox item", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={false}>
            Checkbox Option
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("Checkbox Option")).toBeInTheDocument();
  });

  it("shows checked state", () => {
    const { container } = render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={true}>
            Checked
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = container.querySelector('[data-slot="dropdown-menu-checkbox-item"]');
    expect(item).toHaveAttribute("data-state", "checked");
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={false} onCheckedChange={onCheckedChange}>
            Toggle Me
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByText("Toggle Me"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe("DropdownMenuRadioGroup & DropdownMenuRadioItem", () => {
  it("renders radio group with items", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="option1">
            <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("handles selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="option1" onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByText("Option 2"));
    expect(onValueChange).toHaveBeenCalledWith("option2");
  });
});

describe("DropdownMenuLabel", () => {
  it("renders label", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuLabel>Label Text</DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("Label Text")).toBeInTheDocument();
  });

  it("handles inset prop", () => {
    const { container } = render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const label = container.querySelector('[data-slot="dropdown-menu-label"]');
    expect(label).toHaveAttribute("data-inset", "true");
  });
});

describe("DropdownMenuSeparator", () => {
  it("renders separator", () => {
    const { container } = render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const separator = container.querySelector('[data-slot="dropdown-menu-separator"]');
    expect(separator).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuSeparator className="custom-separator" />
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const separator = container.querySelector('[data-slot="dropdown-menu-separator"]');
    expect(separator).toHaveClass("custom-separator");
  });
});

describe("DropdownMenuShortcut", () => {
  it("renders shortcut text", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Action
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });
});

describe("DropdownMenuSub", () => {
  it("renders submenu", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
              <DropdownMenuItem>Sub Item 2</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("More Options")).toBeInTheDocument();
  });

  it("renders submenu trigger with inset", () => {
    const { container } = render(
      <DropdownMenu open={true}>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>Options</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = container.querySelector('[data-slot="dropdown-menu-sub-trigger"]');
    expect(trigger).toHaveAttribute("data-inset", "true");
  });
});

describe("DropdownMenu integration", () => {
  it("renders complete dropdown menu", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Profile
              <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByText("My Account")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("⌘P")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });
});
