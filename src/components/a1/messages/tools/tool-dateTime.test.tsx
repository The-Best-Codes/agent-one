import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessagePartToolDateTime } from "./tool-dateTime";

vi.mock("@/contexts/use-chat/chat-hooks", () => ({
  useChatFunctions: vi.fn(() => ({
    addToolApprovalResponse: vi.fn(),
  })),
}));

const mockPart = (state: string, overrides = {}) => ({
  type: "tool-call",
  toolCallId: "test-call-id",
  toolName: "dateTime",
  state,
  input: {},
  output: { dateTime: "2024-01-01T12:00:00Z", formatted: "Jan 1, 2024" },
  approval: { id: "approval-id" },
  errorText: "",
  ...overrides,
});

describe("MessagePartToolDateTime", () => {
  it("renders approval requested state", () => {
    render(<MessagePartToolDateTime part={mockPart("approval-requested")} />);
    expect(
      screen.getByText("AgentOne wants to check the date and time"),
    ).toBeInTheDocument();
  });

  it("shows approve and deny buttons in approval state", () => {
    render(<MessagePartToolDateTime part={mockPart("approval-requested")} />);
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Deny")).toBeInTheDocument();
  });

  it("calls addToolApprovalResponse on approve", async () => {
    const user = userEvent.setup();
    const addToolApprovalResponse = vi.fn();
    const { useChatFunctions } = require("@/contexts/use-chat/chat-hooks");
    useChatFunctions.mockReturnValue({ addToolApprovalResponse });

    render(<MessagePartToolDateTime part={mockPart("approval-requested")} />);
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

    render(<MessagePartToolDateTime part={mockPart("approval-requested")} />);
    await user.click(screen.getByText("Deny"));
    expect(addToolApprovalResponse).toHaveBeenCalledWith({
      id: "approval-id",
      approved: false,
    });
  });

  it("renders output-denied state", () => {
    render(<MessagePartToolDateTime part={mockPart("output-denied")} />);
    expect(screen.getByText("Date and time check denied")).toBeInTheDocument();
  });

  it("renders input-streaming state", () => {
    render(<MessagePartToolDateTime part={mockPart("input-streaming")} />);
    expect(screen.getByText("Checking date and time...")).toBeInTheDocument();
  });

  it("renders approval-responded state", () => {
    render(<MessagePartToolDateTime part={mockPart("approval-responded")} />);
    expect(screen.getByText("Checking date and time...")).toBeInTheDocument();
  });

  it("renders input-available state", () => {
    render(<MessagePartToolDateTime part={mockPart("input-available")} />);
    expect(screen.getByText("Checking date and time...")).toBeInTheDocument();
  });

  it("renders output-available state with formatted date", () => {
    render(<MessagePartToolDateTime part={mockPart("output-available")} />);
    expect(
      screen.getByText(/Checked date and time \(Jan 1, 2024\)/),
    ).toBeInTheDocument();
  });

  it("renders cancelled error", () => {
    render(
      <MessagePartToolDateTime
        part={mockPart("output-error", {
          errorText: "agent-one::cancelled-by-user",
        })}
      />,
    );
    expect(
      screen.getByText("Date and time check cancelled"),
    ).toBeInTheDocument();
  });

  it("renders generic error state", () => {
    render(
      <MessagePartToolDateTime
        part={mockPart("output-error", {
          errorText: "Network error",
        })}
      />,
    );
    expect(screen.getByText("Error getting date and time")).toBeInTheDocument();
  });

  it("expands error accordion on click", async () => {
    const user = userEvent.setup();
    render(
      <MessagePartToolDateTime
        part={mockPart("output-error", {
          errorText: "Network error",
        })}
      />,
    );

    await user.click(screen.getByText("Error getting date and time"));
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("renders unknown state fallback", () => {
    render(<MessagePartToolDateTime part={mockPart("unknown-state")} />);
    expect(screen.getByText("Unknown dateTime tool state")).toBeInTheDocument();
  });

  it("shows calendar icon in multiple states", () => {
    const { container } = render(
      <MessagePartToolDateTime part={mockPart("output-available")} />,
    );
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("shows loading icon in streaming state", () => {
    const { container } = render(
      <MessagePartToolDateTime part={mockPart("input-streaming")} />,
    );
    const loadingIcon = container.querySelector('.animate-spin');
    expect(loadingIcon).toBeInTheDocument();
  });

  it("renders with correct key", () => {
    const { container } = render(
      <MessagePartToolDateTime part={mockPart("output-available")} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
