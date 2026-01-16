import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessagePartToolWaitNumberMilliseconds } from "./tool-waitNumberMilliseconds";

vi.mock("@/contexts/use-chat/chat-hooks", () => ({
  useChatFunctions: vi.fn(() => ({
    addToolApprovalResponse: vi.fn(),
  })),
}));

vi.mock("@/lib/logger", () => ({
  getLogger: vi.fn(() => ({
    error: vi.fn(),
  })),
}));

const mockPart = (state: string, milliseconds = 5000, overrides = {}) => ({
  type: "tool-call",
  toolCallId: "test-call-id",
  toolName: "waitNumberMilliseconds",
  state,
  input: { milliseconds },
  output: {},
  approval: { id: "approval-id" },
  errorText: "",
  ...overrides,
});

describe("MessagePartToolWaitNumberMilliseconds", () => {
  it("renders approval requested state", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds part={mockPart("approval-requested")} />,
    );
    expect(screen.getByText(/AgentOne wants to wait/)).toBeInTheDocument();
  });

  it("formats milliseconds in approval request", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds part={mockPart("approval-requested")} />,
    );
    expect(screen.getByText(/5s/)).toBeInTheDocument();
  });

  it("formats complex time (minutes, seconds, ms)", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds
        part={mockPart("approval-requested", 65500)}
      />,
    );
    expect(screen.getByText(/1m 5s 500ms/)).toBeInTheDocument();
  });

  it("formats milliseconds only", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds
        part={mockPart("approval-requested", 500)}
      />,
    );
    expect(screen.getByText(/500ms/)).toBeInTheDocument();
  });

  it("shows approve and deny buttons in approval state", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds part={mockPart("approval-requested")} />,
    );
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Deny")).toBeInTheDocument();
  });

  it("calls addToolApprovalResponse on approve", async () => {
    const user = userEvent.setup();
    const addToolApprovalResponse = vi.fn();
    const { useChatFunctions } = require("@/contexts/use-chat/chat-hooks");
    useChatFunctions.mockReturnValue({ addToolApprovalResponse });

    render(
      <MessagePartToolWaitNumberMilliseconds part={mockPart("approval-requested")} />,
    );
    await user.click(screen.getByText("Approve"));
    expect(addToolApprovalResponse).toHaveBeenCalledWith({
      id: "approval-id",
      approved: true,
    });
  });

  it("calls addToolApprovalResponse on deny", async () => {
    const user = userEvent.setup();
    const addToolApprovalResponse = vi.fn();
    const { useChatFunctions } = require("@/contexts/use-chat/chat-hooks");
    useChatFunctions.mockReturnValue({ addToolApprovalResponse });

    render(
      <MessagePartToolWaitNumberMilliseconds part={mockPart("approval-requested")} />,
    );
    await user.click(screen.getByText("Deny"));
    expect(addToolApprovalResponse).toHaveBeenCalledWith({
      id: "approval-id",
      approved: false,
    });
  });

  it("renders output-denied state", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds part={mockPart("output-denied")} />,
    );
    expect(screen.getByText(/denied/)).toBeInTheDocument();
  });

  it("renders input-streaming state", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds part={mockPart("input-streaming")} />,
    );
    expect(screen.getByText("Waiting a bit...")).toBeInTheDocument();
  });

  it("renders approval-responded state", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds
        part={mockPart("approval-responded")}
      />,
    );
    expect(screen.getByText(/Waiting/)).toBeInTheDocument();
  });

  it("renders input-available state", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds part={mockPart("input-available")} />,
    );
    expect(screen.getByText(/Waiting/)).toBeInTheDocument();
  });

  it("renders output-available state", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds part={mockPart("output-available")} />,
    );
    expect(screen.getByText(/Waited/)).toBeInTheDocument();
  });

  it("renders cancelled error", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds
        part={mockPart("output-error", 5000, {
          errorText: "agent-one::cancelled-by-user",
        })}
      />,
    );
    expect(screen.getByText("Wait cancelled")).toBeInTheDocument();
  });

  it("renders generic error state", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds
        part={mockPart("output-error", 5000, {
          errorText: "Network error",
        })}
      />,
    );
    expect(
      screen.getByText("An error occurred while waiting"),
    ).toBeInTheDocument();
  });

  it("expands error accordion on click", async () => {
    const user = userEvent.setup();
    render(
      <MessagePartToolWaitNumberMilliseconds
        part={mockPart("output-error", 5000, {
          errorText: "Network error",
        })}
      />,
    );

    await user.click(screen.getByText("An error occurred while waiting"));
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("renders unknown state fallback", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds part={mockPart("unknown-state")} />,
    );
    expect(
      screen.getByText("Unknown waitNumberMilliseconds tool state"),
    ).toBeInTheDocument();
  });

  it("shows clock icon in multiple states", () => {
    const { container } = render(
      <MessagePartToolWaitNumberMilliseconds part={mockPart("output-available")} />,
    );
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("shows loading icon in streaming state", () => {
    const { container } = render(
      <MessagePartToolWaitNumberMilliseconds part={mockPart("input-streaming")} />,
    );
    const loadingIcon = container.querySelector('.animate-spin');
    expect(loadingIcon).toBeInTheDocument();
  });

  it("handles zero milliseconds", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds
        part={mockPart("approval-requested", 0)}
      />,
    );
    expect(screen.getByText(/0ms/)).toBeInTheDocument();
  });

  it("handles NaN milliseconds gracefully", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds
        part={mockPart("approval-requested", NaN)}
      />,
    );
    expect(screen.getByText(/unknown/)).toBeInTheDocument();
  });

  it("handles negative milliseconds gracefully", () => {
    render(
      <MessagePartToolWaitNumberMilliseconds
        part={mockPart("approval-requested", -100)}
      />,
    );
    expect(screen.getByText(/unknown/)).toBeInTheDocument();
  });
});
