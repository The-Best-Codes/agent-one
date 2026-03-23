import { IconCopy, IconCopyCheck, IconCopyX } from "@tabler/icons-react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { type ComponentProps, useState } from "react";

import { Button } from "@/components/ui/button";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const logger = getLogger(import.meta.url);

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

type CopyButtonProps = {
  text: string;
  disabledDuration?: number;
  variants?: {
    idle: ButtonVariant;
    copying: ButtonVariant;
    success: ButtonVariant;
    error: ButtonVariant;
  };
} & Omit<ComponentProps<typeof Button>, "onClick" | "disabled" | "variant" | "children">;

export const CopyButton = ({
  text,
  disabledDuration,
  variants,
  className,
  size,
  ...props
}: CopyButtonProps) => {
  const [copyState, setCopyState] = useState<"idle" | "copying" | "success" | "error">("idle");

  const handleCopy = async () => {
    try {
      setCopyState("copying");
      await writeText(text);
      setCopyState("success");
      setTimeout(() => setCopyState("idle"), disabledDuration || 2000);
    } catch (error) {
      logger.error("Error copying content:", error);
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), disabledDuration || 2000);
    }
  };

  const getButtonVariant = () => {
    switch (copyState) {
      case "idle":
        return variants?.idle || "default";
      case "copying":
        return variants?.copying || "default";
      case "success":
        return variants?.success || "default";
      case "error":
        return variants?.error || "default";
    }
  };

  const getButtonIcon = () => {
    switch (copyState) {
      case "idle":
        return <IconCopy />;
      case "copying":
        return <IconCopy />;
      case "success":
        return <IconCopyCheck />;
      case "error":
        return <IconCopyX />;
    }
  };

  return (
    <Button
      onClick={handleCopy}
      disabled={copyState !== "idle"}
      className={cn("size-8 cursor-copy", className)}
      size={size || "icon"}
      variant={getButtonVariant()}
      {...props}
    >
      {getButtonIcon()}
    </Button>
  );
};
