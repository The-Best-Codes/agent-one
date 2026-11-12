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

function resolveTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z_][a-zA-Z0-9_-]*)\}/g, (full, key) => {
    const value = values[key];
    return value === undefined ? full : value;
  });
}

export function createServerFromInstall(
  template: ExtensionInstallTemplate,
  submission: ExtensionInstallSubmission,
): ExtensionInstallResult | null {
  const install = template;
  if (!install) {
    return null;
  }

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
    const command = resolveConfigValue(commandTemplate).trim();
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
