import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { desktopDir, documentDir, downloadDir, homeDir, join, sep } from "@tauri-apps/api/path";
import { platform } from "@tauri-apps/plugin-os";
import { z } from "zod";

import type { McpRegistryMetadata } from "@/lib/settings/types";

import type { CommandShell, ExtensionInstallField, ExtensionInstallTemplate } from "./install";

const BUNDLE_ID_PREFIX = "mcpb:";
const PLACEHOLDER_KEY = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
const VARIABLE = /\$\{([^}]*)\}/g;
const POSIX_SAFE_ARGUMENT = /^[A-Za-z0-9_@%+=:,./-]+$/;
const CMD_SAFE_ARGUMENT = /^[A-Za-z0-9_@+=:,./\\-]+$/;

const userConfigSchema = z.object({
  type: z.enum(["string", "number", "boolean", "directory", "file"]),
  title: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  default: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  multiple: z.boolean().optional(),
  sensitive: z.boolean().optional(),
});

const launchSchema = z.object({
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
});

const manifestSchema = z.object({
  name: z.string().min(1),
  display_name: z.string().optional(),
  version: z.string(),
  description: z.string(),
  author: z.object({ name: z.string() }).optional(),
  homepage: z.string().optional(),
  icon: z.string().optional(),
  icons: z.array(z.object({ src: z.string() })).optional(),
  server: z.object({
    mcp_config: launchSchema.extend({
      command: z.string().min(1),
      platform_overrides: z.record(z.string(), launchSchema).optional(),
    }),
  }),
  user_config: z.record(z.string(), userConfigSchema).optional(),
  compatibility: z.object({ platforms: z.array(z.string()).optional() }).optional(),
});

interface BundleInfo {
  id: string;
  dir: string;
  manifest: unknown;
  manifestHash: string;
}

export interface McpBundle {
  id: string;
  path: string;
  manifestHash: string;
  template: ExtensionInstallTemplate;
  metadata: McpRegistryMetadata;
}

export class McpBundleError extends Error {}

type Segment = { literal: string } | { key: string };

function getBundlePlatform(): string {
  const current = platform();
  if (current === "macos") return "darwin";
  if (current === "windows") return "win32";
  return current;
}

async function getSystemVariables(dir: string): Promise<Record<string, string>> {
  const optional = (load: () => Promise<string>) => load().catch(() => undefined);
  const [home, desktop, documents, downloads] = await Promise.all([
    optional(homeDir),
    optional(desktopDir),
    optional(documentDir),
    optional(downloadDir),
  ]);
  const variables: Record<string, string | undefined> = {
    __dirname: dir,
    HOME: home,
    DESKTOP: desktop,
    DOCUMENTS: documents,
    DOWNLOADS: downloads,
    pathSeparator: sep(),
    "/": sep(),
  };
  return Object.fromEntries(
    Object.entries(variables).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}

function toSegments(
  value: string,
  system: Record<string, string>,
  keys: Map<string, string>,
): Segment[] {
  const segments: Segment[] = [];
  const pushLiteral = (literal: string) => {
    const last = segments.at(-1);
    if (last && "literal" in last) last.literal += literal;
    else if (literal) segments.push({ literal });
  };
  let index = 0;
  for (const match of value.matchAll(VARIABLE)) {
    pushLiteral(value.slice(index, match.index));
    const name = match[1];
    const key = name.startsWith("user_config.") ? keys.get(name.slice(12)) : undefined;
    if (key) segments.push({ key });
    else pushLiteral(Object.hasOwn(system, name) ? system[name] : match[0]);
    index = match.index + match[0].length;
  }
  pushLiteral(value.slice(index));
  return segments;
}

function toTemplate(segments: Segment[], quote: (literal: string) => string): string {
  return segments
    .map((segment) => ("key" in segment ? `{${segment.key}}` : quote(segment.literal)))
    .join("");
}

function quoteArgument(segments: Segment[], shell: CommandShell): string {
  const [only] = segments;
  if (segments.length === 1 && "literal" in only) {
    const safe =
      shell === "posix"
        ? POSIX_SAFE_ARGUMENT.test(only.literal) && !only.literal.startsWith("=")
        : CMD_SAFE_ARGUMENT.test(only.literal) && !only.literal.endsWith("\\");
    if (safe) return only.literal;
  }
  if (shell === "posix") {
    return `'${toTemplate(segments, (literal) => literal.replace(/'/g, `'\\''`))}'`;
  }
  if (segments.some((segment) => "literal" in segment && /["\r\n]/.test(segment.literal))) {
    throw new McpBundleError("This extension's launch settings aren't supported on Windows.");
  }
  return `"${toTemplate(segments, (literal) => literal.replace(/(\\+)$/, "$1$1"))}"`;
}

function getDefaultValue(
  config: z.infer<typeof userConfigSchema>,
  system: Record<string, string>,
): string {
  const values =
    config.default === undefined
      ? []
      : Array.isArray(config.default)
        ? config.default
        : [config.default];
  if (config.type === "boolean") return String(values[0] ?? false);
  return (config.multiple ? values : values.slice(0, 1))
    .map((value) => toTemplate(toSegments(String(value), system, new Map()), (literal) => literal))
    .join("\n");
}

function getIconUrl(dir: string, icon: string | undefined): Promise<string | undefined> {
  if (icon && /^https:\/\//i.test(icon)) return Promise.resolve(icon);
  if (
    !icon ||
    /^([\\/]|[a-zA-Z][a-zA-Z0-9+.-]*:)/.test(icon) ||
    icon.split(/[\\/]/).includes("..")
  ) {
    return Promise.resolve(undefined);
  }
  return join(dir, icon).then(convertFileSrc);
}

export function isMcpBundleServerId(id: string): boolean {
  return id.startsWith(BUNDLE_ID_PREFIX);
}

export async function readMcpBundle(path: string): Promise<McpBundle> {
  const info = await invoke<BundleInfo>("mcpb_read", { path });
  const parsed = manifestSchema.safeParse(info.manifest);
  if (!parsed.success) {
    throw new McpBundleError("This extension file isn't in a format AgentOne supports.");
  }
  const manifest = parsed.data;
  const bundlePlatform = getBundlePlatform();
  const platforms = manifest.compatibility?.platforms;
  if (platforms?.length && !platforms.includes(bundlePlatform)) {
    throw new McpBundleError("This extension doesn't support your device.");
  }

  const system = await getSystemVariables(info.dir);
  const { platform_overrides: overrides, ...base } = manifest.server.mcp_config;
  const override = overrides?.[bundlePlatform];
  const launch = {
    command: override?.command || base.command,
    args: override?.args ?? base.args,
    env: { ...base.env, ...override?.env },
  };
  const parts = [launch.command, ...(launch.args ?? [])];
  const env = Object.entries(launch.env ?? {});
  const literalText = [...parts, ...env.map(([, value]) => value), ...Object.values(system)].join(
    "\n",
  );

  const userConfig = Object.entries(manifest.user_config ?? {});
  const usedKeys = new Set<string>();
  const keys = new Map(
    userConfig.map(([name], index) => {
      let key = PLACEHOLDER_KEY.test(name) ? name : `config_${index}`;
      while (usedKeys.has(key) || literalText.includes(`{${key}}`)) key += "_";
      usedKeys.add(key);
      return [name, key];
    }),
  );

  const shell = bundlePlatform === "win32" ? "cmd" : "posix";
  const commandTemplate = parts
    .map((part) => quoteArgument(toSegments(part, system, keys), shell))
    .join(" ");
  const envDefaults = Object.fromEntries(
    env.map(([key, value]) => [
      key,
      toTemplate(toSegments(value, system, keys), (literal) => literal),
    ]),
  );

  const fields: ExtensionInstallField[] = userConfig.map(([name, config], index) => ({
    id: `mcpb-field-${index}`,
    kind: "variable",
    key: keys.get(name) ?? name,
    label: config.title || name,
    description: config.description,
    required: config.required ?? false,
    secret: config.sensitive ?? false,
    defaultValue: getDefaultValue(config, system),
    options:
      config.type === "boolean"
        ? [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]
        : undefined,
    picker: config.type === "directory" || config.type === "file" ? config.type : undefined,
    multiple: config.multiple && (config.type === "directory" || config.type === "file"),
  }));

  const displayName = manifest.display_name || manifest.name;
  const websiteUrl = /^https?:\/\//i.test(manifest.homepage ?? "") ? manifest.homepage : undefined;

  return {
    id: info.id,
    path,
    manifestHash: info.manifestHash,
    template: {
      id: "mcpb",
      type: "stdio",
      label: "Extension file",
      commandTemplate,
      envDefaults,
      headerDefaults: {},
      fields,
    },
    metadata: {
      displayName,
      description: manifest.description,
      version: manifest.version,
      websiteUrl,
      iconUrl: await getIconUrl(info.dir, manifest.icon ?? manifest.icons?.[0]?.src),
      badges: [],
      searchText: [displayName, manifest.author?.name, manifest.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      transportTypes: ["stdio"],
      author: manifest.author?.name,
      reviewed: false,
    },
  };
}

export async function installMcpBundle(bundle: McpBundle): Promise<void> {
  await invoke("mcpb_install", { path: bundle.path, manifestHash: bundle.manifestHash });
}

export function removeMcpBundle(id: string): Promise<void> {
  return invoke("mcpb_remove", { id });
}
