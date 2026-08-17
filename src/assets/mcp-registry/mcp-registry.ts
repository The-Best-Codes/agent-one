import mcpRegistryData from "./mcp-registry.json";
import type { MCPRegistryEntry, Package, Remote, Transport } from "./types";

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

export interface RegistryInstallField {
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
}

export interface McpRegistryInstallTemplate {
  id: string;
  type: "stdio" | "http";
  label: string;
  runtimeHint?: string;
  commandTemplate?: string;
  urlTemplate?: string;
  envDefaults: Record<string, string>;
  headerDefaults: Record<string, string>;
  fields: RegistryInstallField[];
}

export interface McpRegistryExtension {
  id: string;
  registryName: string;
  displayName: string;
  description: string;
  version: string;
  websiteUrl?: string;
  iconUrl?: string;
  publisher?: string;
  categories: string[];
  tags: string[];
  license?: string;
  keywords: string[];
  packageCount: number;
  installType?: "stdio" | "http";
  requiredFieldCount: number;
  transportTypes: string[];
  updatedAt?: string;
  installTemplates: McpRegistryInstallTemplate[];
  searchText: string;
  registryEntry: MCPRegistryEntry;
}

export interface RegistryInstallSubmission {
  name: string;
  timeoutSec: number;
  requiresApproval: boolean;
  fieldValues: Record<string, string>;
  command?: string;
  url?: string;
}

export type McpRegistryInstallResult =
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

let cachedExtensions: McpRegistryExtension[] | null = null;

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeStringList(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return asStringArray(value);
}

function extractTemplateVariables(template: string): string[] {
  const matches = template.matchAll(/\{([a-zA-Z_][a-zA-Z0-9_-]*)\}/g);
  return Array.from(new Set(Array.from(matches, (match) => match[1])));
}

function resolveTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z_][a-zA-Z0-9_-]*)\}/g, (full, key) => {
    const value = values[key];
    return value === undefined ? full : value;
  });
}

function inferRuntimeHint(registryType?: string): string | undefined {
  if (registryType === "npm") return "npx";
  if (registryType === "pypi") return "uvx";
  if (registryType === "oci") return "docker";
  return undefined;
}

function getRegistryTypeLabel(registryType?: string): string {
  switch (registryType) {
    case "npm":
      return "npm";
    case "pypi":
      return "PyPI";
    case "oci":
      return "Docker";
    case "mcpb":
      return "Packaged binary";
    case "cargo":
      return "Cargo";
    case "github":
      return "GitHub";
    case "local":
      return "Local";
    default:
      return registryType ?? "Package";
  }
}

function getStdioInstallLabel(registryType?: string, runtimeHint?: string): string {
  const base = getRegistryTypeLabel(registryType);
  const runtime = runtimeHint ?? inferRuntimeHint(registryType);
  return runtime ? `${base} (${runtime})` : base;
}

function buildInstallTemplateId(type: string, ...parts: Array<string | undefined>): string {
  return [type, ...parts.filter((part): part is string => Boolean(part))].join(":");
}

function normalizeInputField(
  kind: InstallFieldKind,
  key: string,
  input: Record<string, unknown> | undefined,
): RegistryInstallField {
  return {
    id: `${kind}:${key}`,
    kind,
    key,
    label: key,
    description: asString(input?.description),
    required: Boolean(input?.isRequired),
    secret: Boolean(input?.isSecret),
    defaultValue:
      asString(input?.value) ?? asString(input?.default) ?? asString(input?.placeholder) ?? "",
    placeholder: asString(input?.placeholder),
    choices: Array.isArray(input?.choices)
      ? input.choices.filter((choice): choice is string => typeof choice === "string")
      : undefined,
  };
}

function addVariableField(
  variableFields: Map<string, RegistryInstallField>,
  key: string,
  input?: Record<string, unknown>,
) {
  if (variableFields.has(key)) {
    return;
  }

  variableFields.set(key, {
    id: `variable:${key}`,
    kind: "variable",
    key,
    label: key,
    description: asString(input?.description),
    required: Boolean(input?.isRequired),
    secret: Boolean(input?.isSecret),
    defaultValue:
      asString(input?.value) ?? asString(input?.default) ?? asString(input?.placeholder) ?? "",
    placeholder: asString(input?.placeholder),
    choices: Array.isArray(input?.choices)
      ? input.choices.filter((choice): choice is string => typeof choice === "string")
      : undefined,
  });
}

function toCommandArgumentToken(
  arg: Record<string, unknown>,
  variableFields: Map<string, RegistryInstallField>,
): string | null {
  const argType = asString(arg.type);
  const name = asString(arg.name);
  const value = asString(arg.value);
  const defaultValue = asString(arg.default);
  const valueHint = asString(arg.valueHint);

  if (valueHint && arg.variables && typeof arg.variables === "object") {
    const variablesRecord = arg.variables as Record<string, unknown>;
    const variableConfig = variablesRecord[valueHint];
    addVariableField(
      variableFields,
      valueHint,
      variableConfig && typeof variableConfig === "object"
        ? (variableConfig as Record<string, unknown>)
        : undefined,
    );
  }

  const resolvedValue = value ?? defaultValue ?? (valueHint ? `{${valueHint}}` : undefined);

  if (argType === "named") {
    if (!name) return null;
    if (resolvedValue !== undefined) {
      return `${name}=${resolvedValue}`;
    }
    return name;
  }

  if (resolvedValue !== undefined) {
    return resolvedValue;
  }

  return null;
}

function buildStdioInstallTemplate(pkg: Package): McpRegistryInstallTemplate | undefined {
  const registryType = asString(pkg.registryType);
  const runtimeHint = asString(pkg.runtimeHint) ?? inferRuntimeHint(registryType);
  const identifier = asString(pkg.identifier);

  if (!runtimeHint || !identifier) {
    return undefined;
  }

  const variableFields = new Map<string, RegistryInstallField>();

  const commandParts: string[] = [runtimeHint];
  if (runtimeHint === "npx") {
    commandParts.push("-y");
  }
  commandParts.push(identifier);

  const runtimeArguments = Array.isArray(pkg.runtimeArguments) ? pkg.runtimeArguments : [];
  const packageArguments = Array.isArray(pkg.packageArguments) ? pkg.packageArguments : [];

  for (const argument of [...runtimeArguments, ...packageArguments]) {
    if (!argument || typeof argument !== "object") {
      continue;
    }
    const token = toCommandArgumentToken(argument as Record<string, unknown>, variableFields);
    if (token) {
      commandParts.push(token);
    }
  }

  const commandTemplate = commandParts.join(" ").trim();

  for (const variableName of extractTemplateVariables(commandTemplate)) {
    if (!variableFields.has(variableName)) {
      addVariableField(variableFields, variableName);
    }
  }

  const envDefaults: Record<string, string> = {};
  const envFields: RegistryInstallField[] = [];

  const environmentVariables = Array.isArray(pkg.environmentVariables)
    ? pkg.environmentVariables
    : [];

  for (const envVar of environmentVariables) {
    if (!envVar || typeof envVar !== "object" || typeof envVar.name !== "string") {
      continue;
    }

    const input = envVar as Record<string, unknown>;
    const field = normalizeInputField("env", envVar.name, input);
    envDefaults[envVar.name] = field.defaultValue;
    envFields.push(field);

    const variableNames = extractTemplateVariables(field.defaultValue);
    for (const variableName of variableNames) {
      if (!variableFields.has(variableName)) {
        const variableConfig =
          input.variables && typeof input.variables === "object"
            ? (input.variables as Record<string, unknown>)[variableName]
            : undefined;

        addVariableField(
          variableFields,
          variableName,
          variableConfig && typeof variableConfig === "object"
            ? (variableConfig as Record<string, unknown>)
            : undefined,
        );
      }
    }
  }

  return {
    id: buildInstallTemplateId("stdio", registryType, identifier),
    type: "stdio",
    label: getStdioInstallLabel(registryType, runtimeHint),
    runtimeHint,
    commandTemplate,
    envDefaults,
    headerDefaults: {},
    fields: [...variableFields.values(), ...envFields],
  };
}

function buildHttpInstallTemplate(
  source: Remote | Transport,
): McpRegistryInstallTemplate | undefined {
  const urlTemplate = asString(source.url);

  if (!urlTemplate) {
    return undefined;
  }

  const variableFields = new Map<string, RegistryInstallField>();

  if (source.variables && typeof source.variables === "object") {
    const variablesRecord = source.variables as Record<string, unknown>;
    for (const [key, value] of Object.entries(variablesRecord)) {
      addVariableField(
        variableFields,
        key,
        value && typeof value === "object" ? (value as Record<string, unknown>) : undefined,
      );
    }
  }

  for (const variableName of extractTemplateVariables(urlTemplate)) {
    if (!variableFields.has(variableName)) {
      addVariableField(variableFields, variableName);
    }
  }

  const headerDefaults: Record<string, string> = {};
  const headerFields: RegistryInstallField[] = [];

  const headers = Array.isArray(source.headers) ? source.headers : [];
  for (const header of headers) {
    if (!header || typeof header !== "object" || typeof header.name !== "string") {
      continue;
    }

    const input = header as Record<string, unknown>;
    const field = normalizeInputField("header", header.name, input);
    headerDefaults[header.name] = field.defaultValue;
    headerFields.push(field);

    const variableNames = extractTemplateVariables(field.defaultValue);
    for (const variableName of variableNames) {
      if (!variableFields.has(variableName)) {
        const variableConfig =
          input.variables && typeof input.variables === "object"
            ? (input.variables as Record<string, unknown>)[variableName]
            : undefined;

        addVariableField(
          variableFields,
          variableName,
          variableConfig && typeof variableConfig === "object"
            ? (variableConfig as Record<string, unknown>)
            : undefined,
        );
      }
    }
  }

  return {
    id: buildInstallTemplateId("http", asString(source.type), urlTemplate),
    type: "http",
    label: "HTTP",
    urlTemplate,
    envDefaults: {},
    headerDefaults,
    fields: [...variableFields.values(), ...headerFields],
  };
}

function buildInstallTemplates(server: MCPRegistryEntry["server"]): McpRegistryInstallTemplate[] {
  const templates: McpRegistryInstallTemplate[] = [];
  const packages = Array.isArray(server.packages) ? server.packages : [];
  const remotes = Array.isArray(server.remotes) ? server.remotes : [];

  for (const pkg of packages) {
    if (asString(pkg.transport?.type) === "stdio") {
      const template = buildStdioInstallTemplate(pkg);
      if (template) {
        templates.push(template);
      }
    }
  }

  const seenUrls = new Set<string>();
  for (const pkg of packages) {
    const transportType = asString(pkg.transport?.type);
    if (transportType !== "streamable-http") {
      continue;
    }
    const url = asString(pkg.transport?.url);
    if (!url || seenUrls.has(url)) {
      continue;
    }
    seenUrls.add(url);
    const template = buildHttpInstallTemplate(pkg.transport);
    if (template) {
      templates.push(template);
    }
  }

  for (const remote of remotes) {
    if (remote?.type !== "streamable-http") {
      continue;
    }
    const url = asString(remote.url);
    if (!url || seenUrls.has(url)) {
      continue;
    }
    seenUrls.add(url);
    const template = buildHttpInstallTemplate(remote);
    if (template) {
      templates.push(template);
    }
  }

  return templates;
}

function createSearchText(entry: McpRegistryExtension): string {
  return [
    entry.registryName,
    entry.displayName,
    entry.description,
    entry.version,
    entry.publisher,
    entry.license,
    ...entry.categories,
    ...entry.tags,
    ...entry.keywords,
    ...entry.transportTypes,
    entry.installType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function getMcpRegistryExtensions(): McpRegistryExtension[] {
  if (cachedExtensions) {
    return cachedExtensions;
  }

  const entries = mcpRegistryData as MCPRegistryEntry[];

  cachedExtensions = entries.map((entry) => {
    const server = entry.server;
    const publisherProvided = server._meta?.["io.modelcontextprotocol.registry/publisher-provided"];

    const categories = Array.from(
      new Set([
        ...normalizeStringList(publisherProvided?.categories),
        ...normalizeStringList(publisherProvided?.category),
      ]),
    );

    const tags = normalizeStringList(publisherProvided?.tags);
    const keywords = normalizeStringList(publisherProvided?.keywords);
    const packages = Array.isArray(server.packages) ? server.packages : [];
    const remotes = Array.isArray(server.remotes) ? server.remotes : [];
    const transportTypes = Array.from(
      new Set(
        [
          ...packages
            .map((pkg) => asString(pkg.transport?.type))
            .filter((item): item is string => Boolean(item)),
          ...remotes
            .map((remote) => asString(remote.type))
            .filter((item): item is string => Boolean(item)),
        ].map((transport) => transport.toLowerCase()),
      ),
    );

    const displayName = asString(server.title) ?? asString(server.name) ?? "Unnamed Server";
    const description = asString(server.description) ?? "No description provided.";
    const iconUrl =
      Array.isArray(server.icons) && server.icons.length > 0
        ? asString(server.icons[0]?.src)
        : undefined;
    const installTemplates = buildInstallTemplates(server);

    const extension: McpRegistryExtension = {
      id: `${server.name}@${server.version}`,
      registryName: server.name,
      displayName,
      description,
      version: server.version,
      websiteUrl: asString(server.websiteUrl),
      iconUrl,
      publisher: asString(publisherProvided?.publisher) ?? asString(publisherProvided?.author),
      categories,
      tags,
      license: asString(publisherProvided?.license),
      keywords,
      packageCount: packages.length,
      installType: installTemplates[0]?.type,
      requiredFieldCount: installTemplates[0]?.fields.filter((field) => field.required).length ?? 0,
      transportTypes,
      updatedAt: asString(entry._meta?.["io.modelcontextprotocol.registry/official"]?.updatedAt),
      installTemplates,
      searchText: "",
      registryEntry: entry,
    };

    return {
      ...extension,
      searchText: createSearchText(extension),
    };
  });

  return cachedExtensions;
}

export function createMcpServerFromRegistryInstall(
  template: McpRegistryInstallTemplate,
  submission: RegistryInstallSubmission,
): McpRegistryInstallResult | null {
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
