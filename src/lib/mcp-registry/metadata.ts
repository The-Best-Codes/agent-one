import { z } from "zod";

import type { McpRegistryMetadata, McpServerConfig } from "@/lib/settings/types";

import type { McpRegistryExtension, McpRegistrySummary } from "./install";

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
});

export function getInstalledRegistryMetadata(
  server: McpServerConfig,
): McpRegistryMetadata | undefined {
  const result = metadataSchema.safeParse(server.registryMetadata);
  return result.success ? result.data : undefined;
}

export function createInstalledRegistryMetadata(
  extension: McpRegistrySummary | McpRegistryExtension,
): McpRegistryMetadata {
  return {
    displayName: extension.displayName,
    description: extension.description,
    version: extension.version,
    websiteUrl: extension.websiteUrl,
    iconUrl: extension.iconUrl,
    badges: extension.categories.length ? extension.categories : extension.tags,
    searchText: extension.searchText,
    transportTypes: Array.from(
      new Set(
        extension.transportTypes.flatMap((type) =>
          type === "stdio"
            ? ["stdio" as const]
            : type === "streamable-http"
              ? ["http" as const]
              : [],
        ),
      ),
    ),
    registryEntry: "registryEntry" in extension ? extension.registryEntry : undefined,
  };
}
