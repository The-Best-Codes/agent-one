type InstallFieldKind = "env" | "header" | "variable";

const STDIO_RUNTIME_WHITELIST = new Set([
  "npx",
  "bunx",
  "uvx",
  "pipx",
  "pip",
  "uv",
  "docker",
  "podman",
  "node",
  "bun",
  "python",
  "python3",
  "dnx",
  "dotnet",
]);

export function getStdioRuntimeCommand(command: string): string | undefined {
  const [first] = command.trim().split(/\s+/);
  return first && STDIO_RUNTIME_WHITELIST.has(first) ? first : undefined;
}

export interface ExtensionInstallField {
  id: string;
  kind: InstallFieldKind;
  key: string;
  label: string;
  description?: string;
  required: boolean;
  secret: boolean;
  defaultValue: string;
  placeholder?: string;
  choices?: string[];
  options?: { value: string; label: string; description?: string }[];
  pattern?: string;
  helpUrl?: string;
}

export interface ExtensionInstallTemplate {
  id: string;
  type: "stdio" | "http";
  label: string;
  runtimeHint?: string;
  commandTemplate?: string;
  urlTemplate?: string;
  envDefaults: Record<string, string>;
  headerDefaults: Record<string, string>;
  fields: ExtensionInstallField[];
}

interface ExtensionInstallSubmission {
  name: string;
  timeoutSec: number;
  requiresApproval: boolean;
  fieldValues: Record<string, string>;
  command?: string;
  url?: string;
}

export type ExtensionInstallResult =
  | {
      type: "stdio";
      name: string;
      command: string;
      env: Record<string, string>;
      timeoutSec: number;
      requiresApproval: boolean;
    }
  | {
      type: "http";
      name: string;
      url: string;
      headers: Record<string, string>;
      timeoutSec: number;
      requiresApproval: boolean;
    };

const PLACEHOLDER = /\{([a-zA-Z_][a-zA-Z0-9_-]*)\}/y;
const ALL_PLACEHOLDERS = new RegExp(PLACEHOLDER.source, "g");

function resolveTemplate(template: string, values: Record<string, string>): string {
  return template.replace(ALL_PLACEHOLDERS, (full, key) => {
    const value = values[key];
    return value === undefined ? full : value;
  });
}

export type CommandShell = "posix" | "cmd";

type QuoteState = "none" | "single" | "double";

const POSIX_SAFE_VALUE = /^[A-Za-z0-9_@%+=:,./-]+$/;
const CMD_SAFE_VALUE = /^[A-Za-z0-9_@+=:,./\\-]+$/;

export function getCommandValueError(value: string, shell: CommandShell): string | undefined {
  if (shell === "cmd" && /["\r\n]/.test(value)) {
    return "Double quotes and line breaks aren't supported here on Windows.";
  }
  return undefined;
}

export function getCommandPlaceholderKeys(command: string): Set<string> {
  return new Set(Array.from(command.matchAll(ALL_PLACEHOLDERS), (match) => match[1]));
}

function quotePosixValue(value: string, state: QuoteState, atWordStart: boolean): string {
  if (state === "single") return value.replace(/'/g, `'\\''`);
  if (state === "double") return value.replace(/[\\"$`]/g, "\\$&");
  if (atWordStart && value === "~") return value;
  if (atWordStart && value.startsWith("~/")) {
    return `~/${quotePosixValue(value.slice(2), state, false)}`;
  }
  if (!value || (POSIX_SAFE_VALUE.test(value) && !value.startsWith("="))) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function quoteCmdValue(value: string, state: QuoteState, nextChar: string | undefined): string {
  const doubleTrailingBackslashes = (text: string) => text.replace(/(\\+)$/, "$1$1");
  if (state === "double") return nextChar === '"' ? doubleTrailingBackslashes(value) : value;
  if (!value || (CMD_SAFE_VALUE.test(value) && !value.endsWith("\\"))) return value;
  return `"${doubleTrailingBackslashes(value)}"`;
}

function nextCharAfterEmptyValues(
  template: string,
  index: number,
  values: Record<string, string>,
): string | undefined {
  let position = index;
  for (;;) {
    PLACEHOLDER.lastIndex = position;
    const match = PLACEHOLDER.exec(template);
    if (!match || values[match[1]] !== "") return template[position];
    position += match[0].length;
  }
}

export function resolveCommandTemplate(
  template: string,
  values: Record<string, string>,
  shell: CommandShell,
): string {
  let result = "";
  let state: QuoteState = "none";
  let index = 0;

  while (index < template.length) {
    PLACEHOLDER.lastIndex = index;
    const match = PLACEHOLDER.exec(template);
    if (match) {
      const end = index + match[0].length;
      const raw = values[match[1]];
      const value = state === "none" ? raw?.trim() : raw;
      result +=
        value === undefined
          ? match[0]
          : shell === "cmd"
            ? quoteCmdValue(value, state, nextCharAfterEmptyValues(template, end, values))
            : quotePosixValue(
                value,
                state,
                result === "" || (/[ \t]$/.test(result) && !/\\[ \t]$/.test(result)),
              );
      index = end;
      continue;
    }

    const char = template[index];
    result += char;
    index += 1;

    if (shell === "cmd") {
      if (char === '"') state = state === "double" ? "none" : "double";
    } else if (state === "single") {
      if (char === "'") state = "none";
    } else if (char === "\\") {
      const next = template[index];
      if (next !== undefined) {
        result += next;
        index += 1;
      }
    } else if (char === "'" && state === "none") {
      state = "single";
    } else if (char === '"') {
      state = state === "double" ? "none" : "double";
    }
  }

  return result;
}

export function createServerFromInstall(
  template: ExtensionInstallTemplate,
  submission: ExtensionInstallSubmission,
  shell: CommandShell,
): ExtensionInstallResult | null {
  const install = template;
  const values: Record<string, string> = {};

  for (const field of install.fields) {
    const submitted = submission.fieldValues[field.id];
    values[field.key] = submitted ?? field.defaultValue;
  }

  const resolveConfigValue = (rawValue: string): string => {
    return resolveTemplate(rawValue, values);
  };

  if (install.type === "stdio") {
    const commandTemplate = submission.command ?? install.commandTemplate ?? "";
    const command = resolveCommandTemplate(commandTemplate, values, shell).trim();
    if (!command) {
      return null;
    }

    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(install.envDefaults)) {
      const resolved = resolveConfigValue(value).trim();
      if (resolved) {
        env[key] = resolved;
      }
    }

    for (const field of install.fields) {
      if (field.kind !== "env") {
        continue;
      }

      const resolved = resolveConfigValue(values[field.key] ?? "").trim();
      if (resolved) {
        env[field.key] = resolved;
      } else {
        delete env[field.key];
      }
    }

    return {
      type: "stdio",
      name: submission.name.trim(),
      command,
      env,
      timeoutSec: submission.timeoutSec,
      requiresApproval: submission.requiresApproval,
    };
  }

  const urlTemplate = submission.url ?? install.urlTemplate ?? "";
  const url = resolveConfigValue(urlTemplate).trim();
  if (!url) {
    return null;
  }

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(install.headerDefaults)) {
    const resolved = resolveConfigValue(value).trim();
    if (resolved) {
      headers[key] = resolved;
    }
  }

  for (const field of install.fields) {
    if (field.kind !== "header") {
      continue;
    }

    const resolved = resolveConfigValue(values[field.key] ?? "").trim();
    if (resolved) {
      headers[field.key] = resolved;
    } else {
      delete headers[field.key];
    }
  }

  return {
    type: "http",
    name: submission.name.trim(),
    url,
    headers,
    timeoutSec: submission.timeoutSec,
    requiresApproval: submission.requiresApproval,
  };
}
