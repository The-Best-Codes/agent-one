import { z } from "zod";

const inputSchema = z.looseObject({
  name: z.string().optional(),
  description: z.string().optional(),
  value: z.string().optional(),
  default: z.string().optional(),
  placeholder: z.string().optional(),
  choices: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  isSecret: z.boolean().optional(),
  variables: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
});

const transportSchema = z.looseObject({
  type: z.string(),
  url: z.string().optional(),
  headers: z.array(inputSchema).optional(),
  variables: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
});

const packageSchema = z.looseObject({
  registryType: z.string(),
  identifier: z.string(),
  version: z.string().optional(),
  runtimeHint: z.string().optional(),
  transport: transportSchema,
  environmentVariables: z.array(inputSchema).optional(),
  runtimeArguments: z.array(z.record(z.string(), z.unknown())).optional(),
  packageArguments: z.array(z.record(z.string(), z.unknown())).optional(),
});

export const mcpRegistryEntrySchema = z.looseObject({
  server: z.looseObject({
    name: z.string().min(1),
    version: z.string().min(1),
    title: z.string().optional(),
    description: z.string(),
    websiteUrl: z.string().optional(),
    icons: z.array(z.looseObject({ src: z.string() })).optional(),
    packages: z.array(packageSchema).optional(),
    remotes: z.array(transportSchema).optional(),
    _meta: z
      .looseObject({
        "io.modelcontextprotocol.registry/publisher-provided": z
          .record(z.string(), z.unknown())
          .optional(),
      })
      .optional(),
  }),
  _meta: z.looseObject({
    "io.modelcontextprotocol.registry/official": z.looseObject({
      status: z.enum(["active", "deprecated", "deleted"]),
      updatedAt: z.iso.datetime({ offset: true }),
      isLatest: z.boolean(),
    }),
  }),
});

export const mcpRegistryPageSchema = z.object({
  servers: z.array(mcpRegistryEntrySchema),
  metadata: z.object({ nextCursor: z.string().optional() }),
});

export type MCPRegistryEntry = z.infer<typeof mcpRegistryEntrySchema>;
export type Package = z.infer<typeof packageSchema>;
export type Remote = z.infer<typeof transportSchema>;
export type Transport = Remote;
