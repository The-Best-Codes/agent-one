"use client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
} from "chart.js";
import React, {
  Component,
  ErrorInfo,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
);

interface ChartRendererProps {
  args: {
    chartConfig: any;
  };
  isLoading?: boolean;
  results?: any;
}

interface ChartErrorBoundaryProps {
  children?: ReactNode;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  public state: ChartErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(
    error: Error,
  ): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "Uncaught error caught by ChartErrorBoundary:",
      error,
      errorInfo,
    );
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="border rounded-md p-4 text-destructive">
          <p className="font-medium">Error rendering chart:</p>
          <p className="text-sm">
            An unexpected error occurred while trying to render the chart.
            Please check the chart configuration or component logic.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="text-xs mt-2 overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

const ChartRendererContent: React.FC<ChartRendererProps> = ({
  args,
  isLoading,
}) => {
  const [renderError, setRenderError] = useState<string | null>(null);

  const { type, data, options } = args?.chartConfig || {};

  useEffect(() => {
    if (!args?.chartConfig) {
      setRenderError("No chart configuration provided.");
    } else if (!type || !data || !data.datasets) {
      setRenderError(
        "Invalid chart configuration: missing type, data, or datasets.",
      );
    } else {
      setRenderError(null);
    }
  }, [args?.chartConfig, type, data]);

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
        <p className="font-medium">Chart Configuration Error:</p>
        <p className="text-sm">{renderError}</p>
      </div>
    );
  }

  if (!type || !data || !data.datasets) {
    return null;
  }

  return (
    <div className="border rounded-md p-0">
      <Chart
        type={type}
        data={data}
        options={{
          ...options,
          responsive: options?.responsive ?? true,
          maintainAspectRatio: options?.maintainAspectRatio ?? false,
        }}
        className="w-full h-64 bg-neutral-100 rounded-md"
      />
    </div>
  );
};

export const ChartRenderer: React.FC<ChartRendererProps> = (props) => {
  return (
    <ChartErrorBoundary>
      <ChartRendererContent {...props} />
    </ChartErrorBoundary>
  );
};
