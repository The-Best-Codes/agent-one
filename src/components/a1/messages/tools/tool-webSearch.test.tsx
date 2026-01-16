import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessagePartToolWebSearch } from "./tool-webSearch";

vi.mock("@/contexts/use-chat/chat-hooks", () => ({
  useChatFunctions: vi.fn(() => ({
    addToolApprovalResponse: vi.fn(),
  })),
}));

const mockPart = (state: string, query = "test query", overrides = {}) => ({
  type: "tool-call",
  toolCallId: "test-call-id",
  toolName: "webSearch",
  state,
  input: { query, maxResults: 5 },
  output: {
    success: true,
    query,
    total_results: 3,
    results: [
      {
        title: "Result 1",
        url: "https://example.com/1",
        snippet: "First result snippet",
        display_url: "example.com/1",
      },
      {
        title: "Result 2",
        url: "https://example.com/2",
        snippet: "Second result snippet",
        display_url: "example.com/2",
      },
    ],
    search_url: "https://search.com?q=test",
  },
  approval: { id: "approval-id" },
  errorText: "",
  ...overrides,
});

describe("MessagePartToolWebSearch", () => {
  it("renders approval requested state with query", () => {
    render(
      <MessagePartToolWebSearch part={mockPart("approval-requested")} />,
    );
    expect(
      screen.getByText(/AgentOne wants to search for "test query"/),
    ).toBeInTheDocument();
  });

  it("shows approve and deny buttons in approval state", () => {
    render(
      <MessagePartToolWebSearch part={mockPart("approval-requested")} />,
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
      <MessagePartToolWebSearch part={mockPart("approval-requested")} />,
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
      <MessagePartToolWebSearch part={mockPart("approval-requested")} />,
    );
    await user.click(screen.getByText("Deny"));
    expect(addToolApprovalResponse).toHaveBeenCalledWith({
      id: "approval-id",
      approved: false,
    });
  });

  it("renders output-denied state", () => {
    render(<MessagePartToolWebSearch part={mockPart("output-denied")} />);
    expect(
      screen.getByText(/Web search for "test query" denied/),
    ).toBeInTheDocument();
  });

  it("renders input-streaming state", () => {
    render(<MessagePartToolWebSearch part={mockPart("input-streaming")} />);
    expect(
      screen.getByText(/Searching for "test query".../),
    ).toBeInTheDocument();
  });

  it("renders approval-responded state", () => {
    render(
      <MessagePartToolWebSearch part={mockPart("approval-responded")} />,
    );
    expect(
      screen.getByText(/Searching for "test query".../),
    ).toBeInTheDocument();
  });

  it("renders input-available state", () => {
    render(<MessagePartToolWebSearch part={mockPart("input-available")} />);
    expect(
      screen.getByText(/Searching for "test query".../),
    ).toBeInTheDocument();
  });

  it("handles default query when input is missing", () => {
    render(
      <MessagePartToolWebSearch
        part={mockPart("approval-requested", undefined, { input: {} })}
      />,
    );
    expect(
      screen.getByText(/AgentOne wants to search for "Unknown query"/),
    ).toBeInTheDocument();
  });

  it("renders with search icon in approval state", () => {
    const { container } = render(
      <MessagePartToolWebSearch part={mockPart("approval-requested")} />,
    );
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("shows loading icon in streaming state", () => {
    const { container } = render(
      <MessagePartToolWebSearch part={mockPart("input-streaming")} />,
    );
    const loadingIcon = container.querySelector('.animate-spin');
    expect(loadingIcon).toBeInTheDocument();
  });

  it("renders cancelled error", () => {
    render(
      <MessagePartToolWebSearch
        part={mockPart("output-error", "test query", {
          errorText: "agent-one::cancelled-by-user",
        })}
      />,
    );
    expect(screen.getByText("Search cancelled")).toBeInTheDocument();
  });

  it("has correct border styling in approval state", () => {
    const { container } = render(
      <MessagePartToolWebSearch part={mockPart("approval-requested")} />,
    );
    const wrapper = container.querySelector(".border-border");
    expect(wrapper).toBeInTheDocument();
  });

  it("displays different queries correctly", () => {
    render(
      <MessagePartToolWebSearch
        part={mockPart("approval-requested", "python tutorials")}
      />,
    );
    expect(
      screen.getByText(/AgentOne wants to search for "python tutorials"/),
    ).toBeInTheDocument();
  });
});
