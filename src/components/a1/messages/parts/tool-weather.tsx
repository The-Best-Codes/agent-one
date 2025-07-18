import type { ToolUIPart } from "ai";
import { CloudIcon, Loader2, XCircleIcon } from "lucide-react";

interface WeatherInput {
  latitude: number;
  longitude: number;
}

interface WeatherToolPartProps {
  part: ToolUIPart;
}

export const MessagePartToolWeather = ({ part }: WeatherToolPartProps) => {
  const callId = part.toolCallId;

  switch (part.state) {
    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <div className="animate-spin">
            <Loader2 className="h-4 w-4 text-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">
            Checking weather...
          </span>
        </div>
      );

    case "input-available":
      return (
        <div key={callId} className="flex items-center gap-1">
          <div className="animate-spin">
            <Loader2 className="h-4 w-4 text-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">
            Checking weather for {(part.input as WeatherInput)?.latitude}{" "}
            latitude, {(part.input as WeatherInput)?.longitude} longitude...
          </span>
        </div>
      );

    case "output-available":
      const inputCoords = part.input as WeatherInput;
      return (
        <div key={callId} className="flex items-center gap-1">
          <CloudIcon className="h-4 w-4 text-foreground" />
          <span className="text-sm font-bold text-foreground">
            Checked weather for {inputCoords?.latitude} latitude,{" "}
            {inputCoords?.longitude} longitude
          </span>
        </div>
      );

    case "output-error":
      return (
        <div key={callId} className="flex items-center gap-1">
          <XCircleIcon className="h-4 w-4 text-destructive" />
          <span className="text-sm font-bold text-destructive">
            Error getting weather:{" "}
            <span className="font-normal text-destructive/80">
              {(part as any).errorText}
            </span>
          </span>
        </div>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <CloudIcon className="h-4 w-4 text-foreground" />
          <span className="text-sm font-bold text-foreground">
            Unknown weather tool state
          </span>
        </div>
      );
  }
};
