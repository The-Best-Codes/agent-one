import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy, X } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setIsError(false);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      setIsError(true);
      setIsCopied(false);

      setTimeout(() => {
        setIsError(false);
      }, 2000);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleCopy}
      disabled={isCopied || isError}
      className={cn("opacity-75 hover:opacity-90", className)}
    >
      {isCopied ? <Check /> : isError ? <X /> : <Copy />}
    </Button>
  );
}
