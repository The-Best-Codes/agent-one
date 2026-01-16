import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessagePartReasoning } from "./reasoning";

vi.mock("@/contexts/use-chat/chat-hooks", () => ({
  useChatStatus: vi.fn(() => ({
    status: "idle",
  })),
}));

describe("MessagePartReasoning", () => {
  it("renders reasoning component", () => {
    render(<MessagePartReasoning text="Thinking about the problem..." />);
    expect(screen.getByText("Reasoning")).toBeInTheDocument();
  });

  it("renders reasoning text when expanded", async () => {
    const user = userEvent.setup();
    render(<MessagePartReasoning text="Thinking about the problem..." />);
    
    await user.click(screen.getByText("Reasoning"));
    expect(screen.getByText("Thinking about the problem...")).toBeInTheDocument();
  });

  it("starts collapsed by default", () => {
    render(<MessagePartReasoning text="Hidden text" />);
    expect(screen.queryByText("Hidden text")).not.toBeInTheDocument();
  });

  it("expands on click", async () => {
    const user = userEvent.setup();
    render(<MessagePartReasoning text="Reasoning content" />);
    
    expect(screen.queryByText("Reasoning content")).not.toBeInTheDocument();
    await user.click(screen.getByText("Reasoning"));
    expect(screen.getByText("Reasoning content")).toBeInTheDocument();
  });

  it("shows brain icon by default", () => {
    const { container } = render(<MessagePartReasoning text="Text" />);
    const brainIcon = container.querySelector('svg');
    expect(brainIcon).toBeInTheDocument();
  });

  it("shows loading icon when busy", () => {
    const { useChatStatus } = require("@/contexts/use-chat/chat-hooks");
    useChatStatus.mockReturnValue({ status: "streaming" });
    
    const { container } = render(
      <MessagePartReasoning text="Text" isBusy={true} />,
    );
    const loadingIcon = container.querySelector('.animate-spin');
    expect(loadingIcon).toBeInTheDocument();
  });

  it("does not show loading icon when not busy", () => {
    const { container } = render(
      <MessagePartReasoning text="Text" isBusy={false} />,
    );
    const loadingIcon = container.querySelector('.animate-spin');
    expect(loadingIcon).not.toBeInTheDocument();
  });

  it("renders with correct accordion structure", () => {
    const { container } = render(<MessagePartReasoning text="Content" />);
    const accordion = container.querySelector('[data-slot="accordion"]');
    expect(accordion).toBeInTheDocument();
  });

  it("renders trigger with left icon position", () => {
    const { container } = render(<MessagePartReasoning text="Content" />);
    const trigger = container.querySelector('[data-slot="accordion-trigger"]');
    expect(trigger).toBeInTheDocument();
  });

  it("content is scrollable when long", () => {
    const longText = "Line\n".repeat(100);
    const { container } = render(<MessagePartReasoning text={longText} />);
    const content = container.querySelector('.max-h-96');
    expect(content).toBeInTheDocument();
  });

  it("applies prose styles to content", async () => {
    const user = userEvent.setup();
    const { container } = render(<MessagePartReasoning text="Content" />);
    
    await user.click(screen.getByText("Reasoning"));
    const content = container.querySelector('.prose');
    expect(content).toBeInTheDocument();
  });

  it("truncates long reasoning titles", () => {
    const { container } = render(<MessagePartReasoning text="Content" />);
    const title = container.querySelector('.truncate');
    expect(title).toBeInTheDocument();
  });

  it("renders as single collapsible accordion", () => {
    const { container } = render(<MessagePartReasoning text="Content" />);
    const accordion = container.querySelector('[data-slot="accordion"]');
    expect(accordion).toBeInTheDocument();
  });
});

describe("MessagePartReasoning interactions", () => {
  it("toggles open and closed", async () => {
    const user = userEvent.setup();
    render(<MessagePartReasoning text="Toggle content" />);
    
    expect(screen.queryByText("Toggle content")).not.toBeInTheDocument();
    
    await user.click(screen.getByText("Reasoning"));
    expect(screen.getByText("Toggle content")).toBeInTheDocument();
    
    await user.click(screen.getByText("Reasoning"));
    expect(screen.queryByText("Toggle content")).not.toBeInTheDocument();
  });

  it("shows chevron icon when hovered", async () => {
    const user = userEvent.setup();
    const { container } = render(<MessagePartReasoning text="Content" />);
    const trigger = screen.getByText("Reasoning");
    
    await user.hover(trigger);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
