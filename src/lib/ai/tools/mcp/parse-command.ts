// Unit tests: tests/unit-tests/parse-mcp-stdio-command.test.ts

export interface ParsedCommand {
  program: string;
  args: string[];
}

export function parseMcpStdioCommand(command: string): ParsedCommand {
  const tokens: string[] = [];
  let current = "";
  let quote: "single" | "double" | null = null;

  const pushCurrent = () => {
    if (current.length > 0) {
      tokens.push(current);
      current = "";
    }
  };

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (quote === "single") {
      if (char === "'") {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (quote === "double") {
      if (char === '"') {
        quote = null;
        continue;
      }

      if (char === "\\") {
        const nextChar = command[i + 1];
        if (nextChar === '"' || nextChar === "\\") {
          current += nextChar;
          i++;
        } else {
          current += char;
        }
        continue;
      }

      current += char;
      continue;
    }

    if (/\s/.test(char)) {
      pushCurrent();
      continue;
    }

    if (char === "'") {
      quote = "single";
      continue;
    }

    if (char === '"') {
      quote = "double";
      continue;
    }

    if (char === "\\") {
      const nextChar = command[i + 1];
      if (nextChar === undefined) {
        throw new Error("MCP server command ends with an unfinished escape sequence.");
      }
      current += nextChar;
      i++;
      continue;
    }

    current += char;
  }

  if (quote !== null) {
    throw new Error("MCP server command contains an unmatched quote.");
  }

  pushCurrent();

  if (tokens.length === 0) {
    throw new Error("MCP server command is empty.");
  }

  const [program, ...args] = tokens;
  return { program, args };
}
