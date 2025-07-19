import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ToolUIPart } from "ai";
import { CloudIcon, Loader2Icon, XCircleIcon } from "lucide-react";

interface WeatherInput {
  latitude: number;
  longitude: number;
}

interface WeatherToolPartProps {
  part: ToolUIPart;
}

export const MessagePartToolWeather = ({ part }: WeatherToolPartProps) => {
  const callId = part.toolCallId;
  const inputCoords = part.input as WeatherInput;

  switch (part.state) {
    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <div className="animate-spin">
            <Loader2Icon className="h-4 w-4 shrink-0 text-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">
            Checking weather...
          </span>
        </div>
      );

    case "input-available":
      return (
        <Accordion
          type="single"
          collapsible
          className="w-full rounded-md bg-secondary"
        >
          <AccordionItem value={callId}>
            <AccordionTrigger className="p-2 hover:no-underline">
              <p className="text-sm font-bold text-foreground flex flex-row items-center gap-1">
                <CloudIcon className="h-4 w-4 shrink-0 text-foreground" />
                <span className="max-w-2xl truncate">
                  Checking weather for {inputCoords?.latitude} latitude,{" "}
                  {inputCoords?.longitude} longitude
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="pt-0 pb-2">
              <div className="text-xs text-foreground/80">
                <span className="font-medium">Parameters:</span>
                <pre className="mt-1 bg-transparent p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(inputCoords, null, 2)}
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case "output-available":
      return (
        <Accordion
          type="single"
          collapsible
          className="w-full rounded-md bg-secondary"
        >
          <AccordionItem value={callId}>
            <AccordionTrigger className="p-2 hover:no-underline">
              <p className="text-sm font-bold text-foreground flex flex-row items-center gap-1">
                <CloudIcon className="h-4 w-4 shrink-0 text-foreground" />
                <span className="max-w-2xl truncate">
                  Checked weather for {inputCoords?.latitude} latitude,{" "}
                  {inputCoords?.longitude} longitude
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="pt-0 pb-2">
              <div className="text-sm text-foreground/80">
                <span className="font-medium">Result:</span>
                <pre className="mt-1 bg-transparent p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(part.output, null, 2)}
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case "output-error":
      return (
        <div key={callId} className="flex items-center gap-1">
          <XCircleIcon className="h-4 w-4 shrink-0 text-destructive" />
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
          <CloudIcon className="h-4 w-4 shrink-0 text-foreground" />
          <span className="text-sm font-bold text-foreground">
            Unknown weather tool state
          </span>
        </div>
      );
  }
};
