"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { Chart, ChartConfiguration, registerables } from "chart.js";
import React, { useEffect, useRef, useState } from "react";

Chart.register(...registerables);

interface ChartRendererProps {
  args: {
    chartConfig: ChartConfiguration;
  };
  isLoading?: boolean;
  results?: any;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  args,
  isLoading,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !args?.chartConfig) {
      return;
    }

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    setRenderError(null);

    try {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) {
        setRenderError("Could not get canvas context.");
        return;
      }

      chartInstance.current = new Chart(ctx, args.chartConfig);
    } catch (error: any) {
      console.error("Error rendering chart:", error);
      setRenderError(`Error rendering chart: ${error.message}`);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [args?.chartConfig]);

  if (isLoading) {
    return (
      <div className="border rounded-md p-4 flex flex-col space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (renderError) {
    return (
      <div className="border rounded-md p-4 text-destructive">
        <p className="font-medium">Chart Render Error:</p>
        <p className="text-sm">{renderError}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md p-0">
      <canvas ref={canvasRef} className="w-full h-64"></canvas>
    </div>
  );
};
