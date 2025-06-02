import { z } from "zod";

const ChartDataSchema = z.object({
  labels: z.array(z.string().nullable()).optional(),
  datasets: z.array(
    z.object({
      label: z.string().nullable().optional(),
      data: z.array(z.number().nullable()),
    }),
  ),
});

const ChartOptionsSchema = z.object({
  responsive: z.boolean().optional(),
  maintainAspectRatio: z.boolean().optional(),
  scales: z.record(z.string(), z.any()).optional(),
  plugins: z.record(z.string(), z.any()).optional(),
});

export const ChartConfigSchema = z.object({
  type: z.enum([
    "bar",
    "line",
    "pie",
    "doughnut",
    "polarArea",
    "radar",
    "bubble",
    "scatter",
  ]),
  data: ChartDataSchema,
  options: ChartOptionsSchema.optional(),
});

export const ChartToolParametersSchema = z.object({
  chartConfig: ChartConfigSchema.describe(
    "The configuration object for the Chart.js chart.",
  ),
});
