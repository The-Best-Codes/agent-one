import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

describe("Dialog", () => {
  it("renders dialog component", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onOpenChange when state changes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Test</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("DialogTrigger", () => {
  it("renders trigger button", () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Open Dialog")).toBeInTheDocument();
  });

  it("opens dialog when clicked", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("DialogContent", () => {
  it("renders dialog content", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <div>Content</div>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders close button by default", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("hides close button when showCloseButton is false", () => {
    render(
      <Dialog open={true}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(
      screen.queryByRole("button", { name: /close/i }),
    ).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <Dialog open={true}>
        <DialogContent className="custom-content">
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("custom-content");
  });

  it("has correct data-slot attribute", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "data-slot",
      "dialog-content",
    );
  });
});

describe("DialogOverlay", () => {
  it("renders overlay when dialog is open", () => {
    const { container } = render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const overlay = container.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).toBeInTheDocument();
  });

  it("applies custom className to overlay", () => {
    const { container } = render(
      <DialogPortal>
        <DialogOverlay className="custom-overlay" />
      </DialogPortal>,
    );
    const overlay = container.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).toHaveClass("custom-overlay");
  });
});

describe("DialogHeader", () => {
  it("renders header section", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Header Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Header Title")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader className="custom-header">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    const header = container.querySelector('[data-slot="dialog-header"]');
    expect(header).toHaveClass("custom-header");
  });
});

describe("DialogFooter", () => {
  it("renders footer section", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter>
            <button>Cancel</button>
            <button>Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter className="custom-footer">
            <button>OK</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    const footer = container.querySelector('[data-slot="dialog-footer"]');
    expect(footer).toHaveClass("custom-footer");
  });
});

describe("DialogTitle", () => {
  it("renders title text", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>My Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("My Dialog Title")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle className="custom-title">Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const title = container.querySelector('[data-slot="dialog-title"]');
    expect(title).toHaveClass("custom-title");
  });
});

describe("DialogDescription", () => {
  it("renders description text", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>This is a description</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("This is a description")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription className="custom-description">
            Description
          </DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    const description = container.querySelector(
      '[data-slot="dialog-description"]',
    );
    expect(description).toHaveClass("custom-description");
  });
});

describe("DialogClose", () => {
  it("closes dialog when clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Title</DialogTitle>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByText("Close"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("Dialog integration", () => {
  it("renders complete dialog with all components", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <div>Dialog body content</div>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to proceed?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Dialog body content")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });
});
