import { CopyButton } from "@/components/a1/copy-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TextPartProps {
  part: any;
  isLastTextPart: boolean;
  isLoading: boolean;
}

export const TextPart: React.FC<TextPartProps> = ({
  part,
  isLastTextPart,
  isLoading,
}) => {
  const [expanded, setExpanded] = useState(false);
  const text = part.text;
  const shouldExpand = text.length > 300;

  if (isLastTextPart || !shouldExpand) {
    return (
      <div
        className={`relative ${!isLastTextPart ? "border rounded-md p-2" : ""}`}
      >
        {isLastTextPart && (
          <CopyButton text={text} className="absolute top-0 right-0" />
        )}
        <div className="prose max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 border rounded-md p-2">
      <div
        className={cn(
          "prose max-w-none dark:prose-invert relative",
          expanded
            ? "max-h-fit h-48 overflow-auto"
            : "max-h-24 overflow-hidden",
          isLoading ? "opacity-50" : "opacity-100",
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>

        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
        )}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={() => setExpanded(!expanded)}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          {expanded ? (
            <>
              <ChevronUp />
              <span>Show less</span>
            </>
          ) : (
            <>
              <ChevronDown />
              <span>Show more</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
