import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessagePartToolCall } from "./tool-call";

vi.mock("@/contexts/use-chat/chat-hooks", () => ({
  useChatFunctions: vi.fn(() => ({
    addToolApprovalResponse: vi.fn(),
  })),
}));

const mockPart = (state: string, toolType = "tool-customTool", overrides = {}) => ({
  type: toolType,
  toolCallId: "test-call-id",
  toolName: toolType.replace("tool-", ""),
  state,
  input: {},
  output: {},
  approval: { id: "approval-id" },
  errorText: "",
  ...overrides,
});

describe("MessagePartToolCall", () => {
  it("renders approval requested state with tool name", () => {
    render(<MessagePartToolCall part={mockPart("approval-requested")} />);
    expect(
      screen.getByText(/AgentOne wants to run tool "customTool"/),
    ).toBeInTheDocument();
  });

  it("shows approve and deny buttons in approval state", () => {
    render(<MessagePartToolCall part={mockPart("approval-requested")} />);
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Deny")).toBeInTheDocument();
  });

  it("calls addToolApprovalResponse on approve", async () => {
    const user = userEvent.setup();
    const addToolApprovalResponse = vi.fn();
    const { useChatFunctions } = require("@/contexts/use-chat/chat-hooks");
    useChatFunctions.mockReturnValue({ addToolApprovalResponse });

    render(<MessagePartToolCall part={mockPart("approval-requested")} />);
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

    render(<MessagePartToolCall part={mockPart("approval-requested")} />);
    await user.click(screen.getByText("Deny"));
    expect(addToolApprovalResponse).toHaveBeenCalledWith({
      id: "approval-id",
      approved: false,
    });
  });

  it("renders output-denied state", () => {
    render(<MessagePartToolCall part={mockPart("output-denied")} />);
    expect(screen.getByText(/Tool "customTool" denied/)).toBeInTheDocument();
  });

  it("renders input-streaming state as unknown tool warning", () => {
    render(<MessagePartToolCall part={mockPart("input-streaming")} />);
    expect(
      screen.getByText(/Running unknown tool "customTool"/),
    ).toBeInTheDocument();
  });

  it("renders with wrench icon in approval state", () => {
    const { container } = render(
      <MessagePartToolCall part={mockPart("approval-requested")} />,
    );
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("renders with X icon in denied state", () => {
    const { container } = render(
      <MessagePartToolCall part={mockPart("output-denied")} />,
    );
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("strips 'tool-' prefix from tool name", () => {
    render(
      <MessagePartToolCall
        part={mockPart("approval-requested", "tool-myCustomTool")}
      />,
    );
    expect(
      screen.getByText(/AgentOne wants to run tool "myCustomTool"/),
    ).toBeInTheDocument();
  });

  it("handles different tool types", () => {
    render(
      <MessagePartToolCall
        part={mockPart("output-denied", "tool-differentTool")}
      />,
    );
    expect(
      screen.getByText(/Tool "differentTool" denied/),
    ).toBeInTheDocument();
  });

  it("has correct structure in approval state", () => {
    const { container } = render(
      <MessagePartToolCall part={mockPart("approval-requested")} />,
    );
    const wrapper = container.querySelector(".border-border");
    expect(wrapper).toBeInTheDocument();
  });

  it("renders buttons in correct layout", () => {
    render(<MessagePartToolCall part={mockPart("approval-requested")} />);
    const approveButton = screen.getByText("Approve");
    const denyButton = screen.getByText("Deny");
    expect(approveButton).toBeInTheDocument();
    expect(denyButton).toBeInTheDocument();
  });
});
