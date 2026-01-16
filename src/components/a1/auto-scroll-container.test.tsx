import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  AutoScrollContainer,
  type AutoScrollHandle,
} from "./auto-scroll-container";

describe("AutoScrollContainer", () => {
  it("renders children", () => {
    render(
      <AutoScrollContainer>
        <div>Test Content</div>
      </AutoScrollContainer>,
    );
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies custom className to container", () => {
    const { container } = render(
      <AutoScrollContainer className="custom-class">
        <div>Content</div>
      </AutoScrollContainer>,
    );
    const outerDiv = container.firstChild;
    expect(outerDiv).toHaveClass("custom-class");
  });

  it("applies scrollableClassName to inner div", () => {
    const { container } = render(
      <AutoScrollContainer scrollableClassName="scrollable-custom">
        <div>Content</div>
      </AutoScrollContainer>,
    );
    const scrollableDiv = container.querySelector(".scrollable-custom");
    expect(scrollableDiv).toBeInTheDocument();
  });

  it("renders scroll to bottom button", () => {
    render(
      <AutoScrollContainer>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    const button = screen.getByTestId("scroll-to-bottom");
    expect(button).toBeInTheDocument();
  });

  it("renders default chevron icon in button", () => {
    render(
      <AutoScrollContainer>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    const icon = screen.getByTestId("scroll-to-bottom-icon");
    expect(icon).toBeInTheDocument();
  });

  it("renders custom button children", () => {
    render(
      <AutoScrollContainer scrollButtonChildren={<span>Custom</span>}>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("applies scrollButtonClassName to button", () => {
    render(
      <AutoScrollContainer scrollButtonClassName="button-custom">
        <div>Content</div>
      </AutoScrollContainer>,
    );
    const button = screen.getByTestId("scroll-to-bottom");
    expect(button).toHaveClass("button-custom");
  });

  it("has correct aria-label on button", () => {
    render(
      <AutoScrollContainer>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    const button = screen.getByLabelText("Scroll to bottom");
    expect(button).toBeInTheDocument();
  });

  it("handles button click", async () => {
    const user = userEvent.setup();
    render(
      <AutoScrollContainer>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    const button = screen.getByTestId("scroll-to-bottom");
    await user.click(button);
    expect(button).toBeInTheDocument();
  });

  it("passes scrollButtonProps to button", () => {
    render(
      <AutoScrollContainer scrollButtonProps={{ disabled: true }}>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    const button = screen.getByTestId("scroll-to-bottom");
    expect(button).toBeDisabled();
  });

  it("exposes scrollToBottom via ref", () => {
    const ref = { current: null } as React.RefObject<AutoScrollHandle>;
    render(
      <AutoScrollContainer ref={ref}>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    expect(ref.current).toBeTruthy();
    expect(ref.current?.scrollToBottom).toBeDefined();
  });

  it("scrollToBottom can be called via ref", () => {
    const ref = { current: null } as React.RefObject<AutoScrollHandle>;
    render(
      <AutoScrollContainer ref={ref}>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    expect(() => ref.current?.scrollToBottom()).not.toThrow();
  });

  it("renders scrollable container with correct test id", () => {
    render(
      <AutoScrollContainer>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    const scrollable = screen.getByTestId("auto-scroll-container-scrollable");
    expect(scrollable).toBeInTheDocument();
  });

  it("renders with smooth scroll behavior", () => {
    render(
      <AutoScrollContainer behavior="smooth">
        <div>Content</div>
      </AutoScrollContainer>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders with instant scroll behavior", () => {
    render(
      <AutoScrollContainer behavior="instant">
        <div>Content</div>
      </AutoScrollContainer>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders with custom buttonScrollBehavior", () => {
    render(
      <AutoScrollContainer buttonScrollBehavior="instant">
        <div>Content</div>
      </AutoScrollContainer>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders with watchResize enabled", () => {
    render(
      <AutoScrollContainer watchResize={true}>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders with custom slide distances", () => {
    render(
      <AutoScrollContainer slideStartDistance={100} slideEndDistance={20}>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("handles multiple children", () => {
    render(
      <AutoScrollContainer>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </AutoScrollContainer>,
    );
    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
    expect(screen.getByText("Child 3")).toBeInTheDocument();
  });

  it("button has correct initial transform style", () => {
    render(
      <AutoScrollContainer>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    const button = screen.getByTestId("scroll-to-bottom");
    expect(button).toHaveStyle({ transform: expect.stringContaining("translateY") });
  });

  it("button is hidden when at bottom (aria-hidden)", () => {
    render(
      <AutoScrollContainer>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    const button = screen.getByTestId("scroll-to-bottom");
    expect(button).toHaveAttribute("aria-hidden");
  });

  it("button has tabIndex -1 when hidden", () => {
    render(
      <AutoScrollContainer>
        <div>Content</div>
      </AutoScrollContainer>,
    );
    const button = screen.getByTestId("scroll-to-bottom");
    expect(button).toHaveAttribute("tabIndex", "-1");
  });
});

describe("AutoScrollContainer integration", () => {
  it("renders complete component with all features", () => {
    const ref = { current: null } as React.RefObject<AutoScrollHandle>;
    render(
      <AutoScrollContainer
        ref={ref}
        className="container-custom"
        scrollableClassName="scrollable-custom"
        scrollButtonClassName="button-custom"
        scrollButtonChildren={<span>↓</span>}
        behavior="smooth"
        watchResize={true}
      >
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </AutoScrollContainer>,
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
    expect(screen.getByText("↓")).toBeInTheDocument();
    expect(ref.current?.scrollToBottom).toBeDefined();
  });
});
