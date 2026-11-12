import { z } from "zod";

import { AGENT_ONE_EXTENSIONS_URL, AGENT_ONE_WEBSITE_URL } from "@/lib/constants";
import type { McpRegistryMetadata, McpServerConfig } from "@/lib/settings/types";

import type { ExtensionInstallTemplate } from "./install";
import { getInstalledExtensionMetadata } from "./metadata";

const MANIFEST_URL = `${AGENT_ONE_WEBSITE_URL}/api/extensions/manifest`;
const MANIFEST_TIMEOUT_MS = 15000;

const fieldSchema = z.object({
  id: z.string(),
  kind: z.enum(["env", "header", "variable"]),
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean(),
  secret: z.boolean(),
  defaultValue: z.string(),
  placeholder: z.string().optional(),
  choices: z.array(z.string()).optional(),
  options: z
    .array(z.object({ value: z.string(), label: z.string(), description: z.string().optional() }))
    .optional(),
  pattern: z.string().optional(),
  helpUrl: z.string().optional(),
});

const templateSchema = z.object({
  id: z.string(),
  type: z.enum(["stdio", "http"]),
  label: z.string(),
  runtimeHint: z.string().optional(),
  commandTemplate: z.string().optional(),
  urlTemplate: z.string().optional(),
  envDefaults: z.record(z.string(), z.string()),
  headerDefaults: z.record(z.string(), z.string()),
  fields: z.array(fieldSchema),
});

const manifestSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  serverId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  iconUrl: z.string().optional(),
  author: z.string().optional(),
  websiteUrl: z.string().optional(),
  pageUrl: z.string(),
  reviewed: z.boolean(),
  categories: z.array(z.string()),
  extensionVersion: z.string().optional(),
  signIn: z.enum(["none", "optional", "required", "unknown"]),
  setupNote: z.string().optional(),
  templates: z.array(templateSchema),
});

export type ExtensionManifest = z.infer<typeof manifestSchema>;

export class ExtensionNotFoundError extends Error {}

export function isValidExtensionLinkId(id: string): boolean {
  return id.length <= 300 && /^[\w.@-]+(\/[\w.@-]+)*$/.test(id);
}

export async function fetchExtensionManifest(id: string): Promise<ExtensionManifest> {
  const response = await fetch(`${MANIFEST_URL}?id=${encodeURIComponent(id)}`, {
    signal: AbortSignal.timeout(MANIFEST_TIMEOUT_MS),
  });
  if (response.status === 404) throw new ExtensionNotFoundError(id);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return manifestSchema.parse(await response.json());
}

export function createManifestMetadata(
  manifest: ExtensionManifest,
  template: ExtensionInstallTemplate,
): McpRegistryMetadata {
  return {
    displayName: manifest.name,
    description: manifest.description,
    version: manifest.extensionVersion ?? "",
    websiteUrl: manifest.websiteUrl,
    iconUrl: manifest.iconUrl,
    badges: manifest.categories,
    searchText: [manifest.name, manifest.author, manifest.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
    transportTypes: [template.type],
    author: manifest.author,
    pageUrl: manifest.pageUrl,
    reviewed: manifest.reviewed,
  };
}

export function getExtensionPageUrl(server: McpServerConfig): string | undefined {
  const metadata = getInstalledExtensionMetadata(server);
  if (!metadata) return undefined;
  if (metadata.pageUrl?.startsWith(`${AGENT_ONE_EXTENSIONS_URL}/`)) return metadata.pageUrl;
  return isValidExtensionLinkId(server.id)
    ? `${AGENT_ONE_EXTENSIONS_URL}/community/${server.id.split("/").map(encodeURIComponent).join("/")}`
    : undefined;
}
