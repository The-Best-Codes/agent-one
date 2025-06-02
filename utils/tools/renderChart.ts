import { tool } from "ai";
import { ChartToolParametersSchema } from "./renderChartTool/index";
import { z } from "zod";

export const renderChart = tool({
  description:
    "Generates a chart visualization based on provided data and configuration using Chart.js.",
  parameters: ChartToolParametersSchema,
  execute: async ({
    chartConfig,
  }: {
    chartConfig: z.infer<typeof ChartToolParametersSchema>["chartConfig"];
  }) => {
    try {
      console.log(
        "Chart tool called with config:",
        JSON.stringify(chartConfig, null, 2),
      );

      return { status: "Chart generated in the UI." };
    } catch (error: any) {
      console.error("Error in chartTool execution:", error);
      return { status: `Error generating chart: ${error.message}` };
    }
  },
});
