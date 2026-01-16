import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

describe("Select", () => {
  it("renders select component", () => {
    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item 1</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("handles value changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Option 1"));
    expect(onValueChange).toHaveBeenCalledWith("option1");
  });

  it("shows selected value", () => {
    render(
      <Select value="selected" open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="selected">Selected Item</SelectItem>
          <SelectItem value="other">Other Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    const selected = screen.getByText("Selected Item");
    expect(selected.closest('[data-slot="select-item"]')).toHaveAttribute("data-state", "checked");
  });
});

describe("SelectTrigger", () => {
  it("renders trigger button", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("applies default size", () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = container.querySelector('[data-slot="select-trigger"]');
    expect(trigger).toHaveAttribute("data-size", "default");
  });

  it("applies small size", () => {
    const { container } = render(
      <Select>
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = container.querySelector('[data-slot="select-trigger"]');
    expect(trigger).toHaveAttribute("data-size", "sm");
  });

  it("applies custom className", () => {
    const { container } = render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = container.querySelector('[data-slot="select-trigger"]');
    expect(trigger).toHaveClass("custom-trigger");
  });

  it("renders chevron icon", () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});

describe("SelectValue", () => {
  it("renders placeholder when no value selected", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText("Select an option")).toBeInTheDocument();
  });

  it("has correct data-slot attribute", () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(container.querySelector('[data-slot="select-value"]')).toBeInTheDocument();
  });
});

describe("SelectContent", () => {
  it("renders when select is open", () => {
    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Content Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText("Content Item")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="custom-content">
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    const content = container.querySelector('[data-slot="select-content"]');
    expect(content).toHaveClass("custom-content");
  });

  it("renders scroll buttons", () => {
    const { container } = render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(container.querySelector('[data-slot="select-scroll-up-button"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="select-scroll-down-button"]')).toBeInTheDocument();
  });
});

describe("SelectItem", () => {
  it("renders item", () => {
    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="test">Test Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText("Test Item")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1" className="custom-item">
            Item
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    const item = container.querySelector('[data-slot="select-item"]');
    expect(item).toHaveClass("custom-item");
  });

  it("handles disabled state", () => {
    const { container } = render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1" disabled>
            Disabled
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    const item = container.querySelector('[data-slot="select-item"]');
    expect(item).toHaveAttribute("data-disabled");
  });

  it("shows check icon for selected item", () => {
    const { container } = render(
      <Select value="selected" open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="selected">Selected</SelectItem>
        </SelectContent>
      </Select>,
    );
    const item = container.querySelector('[data-slot="select-item"]');
    expect(item).toHaveAttribute("data-state", "checked");
  });
});

describe("SelectGroup", () => {
  it("renders group of items", () => {
    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="1">Item 1</SelectItem>
            <SelectItem value="2">Item 2</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("has correct data-slot attribute", () => {
    const { container } = render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="1">Item</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );
    expect(container.querySelector('[data-slot="select-group"]')).toBeInTheDocument();
  });
});

describe("SelectLabel", () => {
  it("renders label", () => {
    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectLabel>Group Label</SelectLabel>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText("Group Label")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectLabel className="custom-label">Label</SelectLabel>
        </SelectContent>
      </Select>,
    );
    const label = container.querySelector('[data-slot="select-label"]');
    expect(label).toHaveClass("custom-label");
  });
});

describe("SelectSeparator", () => {
  it("renders separator", () => {
    const { container } = render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item 1</SelectItem>
          <SelectSeparator />
          <SelectItem value="2">Item 2</SelectItem>
        </SelectContent>
      </Select>,
    );
    const separator = container.querySelector('[data-slot="select-separator"]');
    expect(separator).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectSeparator className="custom-separator" />
        </SelectContent>
      </Select>,
    );
    const separator = container.querySelector('[data-slot="select-separator"]');
    expect(separator).toHaveClass("custom-separator");
  });
});

describe("Select integration", () => {
  it("renders complete select with groups and labels", () => {
    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue placeholder="Select fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem value="carrot">Carrot</SelectItem>
            <SelectItem value="lettuce">Lettuce</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    expect(screen.getByText("Fruits")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getByText("Vegetables")).toBeInTheDocument();
    expect(screen.getByText("Carrot")).toBeInTheDocument();
  });
});
