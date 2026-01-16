import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NoMcpServers } from "./no-mcp-servers";

describe("NoMcpServers", () => {
  it("renders correctly", () => {
    render(<NoMcpServers />);
    expect(screen.getByText(/No MCP servers configured/i)).toBeInTheDocument();
  });

  it("displays the full message", () => {
    render(<NoMcpServers />);
    expect(
      screen.getByText('No MCP servers configured. Click "Add Server" to get started.')
    ).toBeInTheDocument();
  });

  it("has correct styling classes", () => {
    const { container } = render(<NoMcpServers />);
    const div = container.firstChild as HTMLElement;
    
    expect(div).toHaveClass("text-muted-foreground");
    expect(div).toHaveClass("rounded-lg");
    expect(div).toHaveClass("border");
    expect(div).toHaveClass("border-dashed");
    expect(div).toHaveClass("p-8");
    expect(div).toHaveClass("text-center");
    expect(div).toHaveClass("text-sm");
  });

  it("is a div element", () => {
    const { container } = render(<NoMcpServers />);
    expect(container.firstChild?.nodeName).toBe("DIV");
  });
});
