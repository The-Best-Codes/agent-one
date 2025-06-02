import { z } from "zod";

const ChartDataPointSchema = z.union([
  z.number(),
  z.null(),
  z
    .object({ x: z.number(), y: z.number(), r: z.number().optional() })
    .passthrough(),
  z.record(z.string(), z.unknown()),
]);

const ChartDatasetSchema = z
  .object({
    data: z
      .array(ChartDataPointSchema)
      .describe(
        "The primary data array for the dataset. Accepts numbers, nulls, or objects (e.g., {x, y}, {x, y, r}) for scatter/bubble charts.",
      ),
  })
  .passthrough()
  .describe(
    "A Chart.js dataset object, allowing any standard Chart.js dataset properties like label, backgroundColor, borderColor, borderWidth, type, xAxisID, yAxisID, etc.",
  );

const ChartDataSchema = z
  .object({
    labels: z.array(z.string().nullable()).optional(),
    datasets: z
      .array(ChartDatasetSchema)
      .describe("An array of dataset objects."),
  })
  .describe("The data configuration for the Chart.js chart.");

const ChartOptionsSchema = z
  .record(z.string(), z.any())
  .optional()
  .describe(
    "The options configuration for the Chart.js chart, allowing any standard Chart.js options properties for scales, plugins, layout, animation, etc.",
  );

export const ChartConfigSchema = z
  .object({
    type: z
      .enum([
        "bar",
        "line",
        "pie",
        "doughnut",
        "polarArea",
        "radar",
        "bubble",
        "scatter",
      ])
      .describe("The type of chart to render."),
    data: ChartDataSchema,
    options: ChartOptionsSchema,
  })
  .describe("The complete configuration object for the Chart.js chart.");

export const ChartToolParametersSchema = z
  .object({
    chartConfig: ChartConfigSchema.describe(
      "The comprehensive configuration object for the Chart.js chart, including type, flexible data (with any dataset properties), and flexible options.",
    ),
  })
  .describe("Parameters object for the renderChart tool.");
