import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";

describe("Drawer", () => {
  it("renders drawer component", () => {
    render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>Test Drawer</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Drawer open={false}>
        <DrawerContent>
          <DrawerTitle>Test Drawer</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onOpenChange when state changes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer open={true} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerTitle>Test</DrawerTitle>
          <DrawerClose>Close</DrawerClose>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByText("Close"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("DrawerTrigger", () => {
  it("renders trigger button", () => {
    render(
      <Drawer>
        <DrawerTrigger>Open Drawer</DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Test</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("Open Drawer")).toBeInTheDocument();
  });

  it("opens drawer when clicked", async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Drawer Title</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("DrawerContent", () => {
  it("renders drawer content", () => {
    render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>Title</DrawerTitle>
          <div>Content</div>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders handle by default", () => {
    const { container } = render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>Title</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const handle = container.querySelector(".h-2.w-\\[100px\\]");
    expect(handle).toBeInTheDocument();
  });

  it("hides handle when showHandle is false", () => {
    const { container } = render(
      <Drawer open={true}>
        <DrawerContent showHandle={false}>
          <DrawerTitle>Title</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const handle = container.querySelector(".h-2.w-\\[100px\\]");
    expect(handle).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <Drawer open={true}>
        <DrawerContent className="custom-content">
          <DrawerTitle>Title</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveClass("custom-content");
  });

  it("has correct data-slot attribute", () => {
    render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>Title</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "data-slot",
      "drawer-content",
    );
  });
});

describe("DrawerOverlay", () => {
  it("renders overlay when drawer is open", () => {
    const { container } = render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>Title</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const overlay = container.querySelector('[data-slot="drawer-overlay"]');
    expect(overlay).toBeInTheDocument();
  });

  it("applies custom className to overlay", () => {
    const { container } = render(
      <DrawerPortal>
        <DrawerOverlay className="custom-overlay" />
      </DrawerPortal>,
    );
    const overlay = container.querySelector('[data-slot="drawer-overlay"]');
    expect(overlay).toHaveClass("custom-overlay");
  });
});

describe("DrawerHeader", () => {
  it("renders header section", () => {
    render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Header Title</DrawerTitle>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("Header Title")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerHeader className="custom-header">
            <DrawerTitle>Title</DrawerTitle>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>,
    );
    const header = container.querySelector('[data-slot="drawer-header"]');
    expect(header).toHaveClass("custom-header");
  });
});

describe("DrawerFooter", () => {
  it("renders footer section", () => {
    render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>Title</DrawerTitle>
          <DrawerFooter>
            <button>Cancel</button>
            <button>Save</button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>Title</DrawerTitle>
          <DrawerFooter className="custom-footer">
            <button>OK</button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    const footer = container.querySelector('[data-slot="drawer-footer"]');
    expect(footer).toHaveClass("custom-footer");
  });
});

describe("DrawerTitle", () => {
  it("renders title text", () => {
    render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>My Drawer Title</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("My Drawer Title")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle className="custom-title">Title</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const title = container.querySelector('[data-slot="drawer-title"]');
    expect(title).toHaveClass("custom-title");
  });
});

describe("DrawerDescription", () => {
  it("renders description text", () => {
    render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>Title</DrawerTitle>
          <DrawerDescription>This is a description</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("This is a description")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>Title</DrawerTitle>
          <DrawerDescription className="custom-description">
            Description
          </DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    const description = container.querySelector(
      '[data-slot="drawer-description"]',
    );
    expect(description).toHaveClass("custom-description");
  });
});

describe("DrawerClose", () => {
  it("closes drawer when clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer open={true} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerTitle>Title</DrawerTitle>
          <DrawerClose>Close</DrawerClose>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByText("Close"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("Drawer integration", () => {
  it("renders complete drawer with all components", () => {
    render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>
              Manage your application settings
            </DrawerDescription>
          </DrawerHeader>
          <div>Drawer body content</div>
          <DrawerFooter>
            <DrawerClose>Cancel</DrawerClose>
            <button>Save Changes</button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(
      screen.getByText("Manage your application settings"),
    ).toBeInTheDocument();
    expect(screen.getByText("Drawer body content")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
  });
});
