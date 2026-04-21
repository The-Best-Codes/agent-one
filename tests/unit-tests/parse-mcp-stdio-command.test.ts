// Source file: src/lib/ai/tools/mcp/parse-command.ts

import { describe, expect, it } from "vitest";

import { parseMcpStdioCommand } from "@/lib/ai/tools/mcp/parse-command";

describe("parseMcpStdioCommand", () => {
  it("parses a simple command", () => {
    expect(parseMcpStdioCommand("node server.js")).toEqual({
      program: "node",
      args: ["server.js"],
    });
  });

  it("preserves quoted paths and arguments with spaces", () => {
    expect(
      parseMcpStdioCommand('npx -y @modelcontextprotocol/server-filesystem "/tmp/My Folder"'),
    ).toEqual({
      program: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp/My Folder"],
    });
  });

  it("supports escaped whitespace outside quotes", () => {
    expect(parseMcpStdioCommand("node /tmp/My\\ Folder/server.js --name hello\\ world")).toEqual({
      program: "node",
      args: ["/tmp/My Folder/server.js", "--name", "hello world"],
    });
  });

  it("preserves backslashes in quoted Windows-style paths", () => {
    expect(parseMcpStdioCommand('node "C:\\Program Files\\MCP Server\\index.js"')).toEqual({
      program: "node",
      args: ["C:\\Program Files\\MCP Server\\index.js"],
    });
  });

  it("supports escaped quotes inside double quotes", () => {
    expect(parseMcpStdioCommand('node --message "say \\"hello\\""')).toEqual({
      program: "node",
      args: ["--message", 'say "hello"'],
    });
  });

  it("throws on unmatched quotes", () => {
    expect(() => parseMcpStdioCommand('node "unterminated')).toThrow(
      "MCP server command contains an unmatched quote.",
    );
  });

  it("throws on unfinished escape sequences", () => {
    expect(() => parseMcpStdioCommand("node trailing\\")).toThrow(
      "MCP server command ends with an unfinished escape sequence.",
    );
  });
});
