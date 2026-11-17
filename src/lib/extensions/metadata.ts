import { z } from "zod";

import type { McpRegistryMetadata, McpServerConfig } from "@/lib/settings/types";

const metadataSchema = z.object({
  displayName: z.string(),
  description: z.string(),
  version: z.string(),
  websiteUrl: z.string().optional(),
  iconUrl: z.string().optional(),
  badges: z.array(z.string()),
  searchText: z.string(),
  transportTypes: z.array(z.enum(["stdio", "http"])),
  registryEntry: z.unknown().optional(),
  author: z.string().optional(),
  pageUrl: z.string().optional(),
  reviewed: z.boolean().optional(),
});

export function getInstalledExtensionMetadata(
  server: McpServerConfig,
): McpRegistryMetadata | undefined {
  const result = metadataSchema.safeParse(server.registryMetadata);
  return result.success ? result.data : undefined;
}

export function getExtensionSourceLabel(
  metadata: McpRegistryMetadata | undefined,
): string | undefined {
  if (!metadata) return "Custom";
  return metadata.reviewed ? undefined : "Community";
}
