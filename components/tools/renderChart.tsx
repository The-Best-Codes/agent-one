"use client";

import React, { useRef, useEffect, useState } from "react";
import { Chart, registerables, ChartConfiguration } from "chart.js";
import { Skeleton } from "@/components/ui/skeleton";

// Register all standard Chart.js components
Chart.register(...registerables);

interface ChartRendererProps {
  args: {
    chartConfig: ChartConfiguration; // Use the Chart.js type for better compatibility
  };
  isLoading?: boolean;
  results?: any; // We don't strictly need results for rendering, but keep the prop signature consistent
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

    // Destroy existing chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    setRenderError(null); // Reset error state

    try {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) {
        setRenderError("Could not get canvas context.");
        return;
      }

      // Create a new chart instance
      chartInstance.current = new Chart(ctx, args.chartConfig);
    } catch (error: any) {
      console.error("Error rendering chart:", error);
      setRenderError(`Error rendering chart: ${error.message}`);
    }

    // Cleanup function to destroy the chart when the component unmounts
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [args?.chartConfig]); // Re-run effect if chartConfig changes

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

  // Render the canvas element
  return (
    <div className="border rounded-md p-0 mt-2">
      <canvas ref={canvasRef} className="w-full h-64"></canvas>
    </div>
  );
};
