import { z } from "zod";

import modelDirectoryDataRaw from "./model-directory.json";
export { MODEL_DIRECTORY_SOURCE_URL, normalizeModelDirectory } from "./shared.js";

// eslint-disable-next-line no-control-regex
const controlCharacterPattern = /[\u0000-\u001f\u007f]/;

const safeStringSchema = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .refine((value) => !controlCharacterPattern.test(value), {
      message: "must not contain control characters",
    });

const finiteNumberSchema = z.number().nonnegative();
const finiteIntegerSchema = z.number().int().nonnegative();

const modalitySchema = z.enum(["text", "image", "audio", "video", "file"]);

const featuresSchema = z
  .object({
    attachment: z.boolean().optional(),
    reasoning: z.boolean().optional(),
    tool_call: z.boolean().optional(),
    structured_output: z.boolean().optional(),
    temperature: z.boolean().optional(),
  })
  .strict();

const pricingSchema = z
  .object({
    input: finiteNumberSchema.optional(),
    output: finiteNumberSchema.optional(),
    reasoning: finiteNumberSchema.optional(),
    cache_read: finiteNumberSchema.optional(),
    cache_write: finiteNumberSchema.optional(),
    input_audio: finiteNumberSchema.optional(),
    output_audio: finiteNumberSchema.optional(),
  })
  .strict();

const limitSchema = z
  .object({
    context: finiteIntegerSchema.optional(),
    input: finiteIntegerSchema.optional(),
    output: finiteIntegerSchema.optional(),
  })
  .strict();

const modalitiesSchema = z
  .object({
    input: z.array(modalitySchema).optional(),
    output: z.array(modalitySchema).optional(),
  })
  .strict();

const modelSchema = z.looseObject({
  id: safeStringSchema(200),
  name: safeStringSchema(500).optional(),
  features: featuresSchema.optional(),
  pricing: pricingSchema.optional(),
  limit: limitSchema.optional(),
  modalities: modalitiesSchema.optional(),
});

const providerSchema = z.looseObject({
  id: z.string().min(1),
  name: z.string().min(1),
  models: z.record(z.string(), modelSchema),
});

export const modelDirectorySchema = z.record(z.string(), providerSchema);

export type ModelRecord = z.infer<typeof modelSchema>;
export type ProviderEntry = z.infer<typeof providerSchema>;
export type ModelDirectoryData = z.infer<typeof modelDirectorySchema>;

export const modelDirectoryData: ModelDirectoryData =
  modelDirectorySchema.parse(modelDirectoryDataRaw);
