import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ClipboardCopyIcon, Loader2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { DeviceFlowState } from "@/contexts/use-web-auth/web-auth-contexts";
import { cn } from "@/lib/utils";

interface DeviceCodeDisplayProps {
  deviceFlow: DeviceFlowState;
  onCancel: () => void;
  className?: string;
}

export function DeviceCodeDisplay({
  deviceFlow,
  onCancel,
  className,
}: DeviceCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await writeText(deviceFlow.userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <p className="text-muted-foreground text-sm">
        A browser window has been opened. Enter the code below to link this
        device to your account.
      </p>
      <button
        onClick={handleCopy}
        className="bg-muted hover:bg-muted/80 flex items-center gap-2 rounded-md px-4 py-2 font-mono text-xl font-bold tracking-[0.2em] transition-colors"
      >
        {deviceFlow.userCode}
        <ClipboardCopyIcon className="text-muted-foreground size-4" />
      </button>
      <p className="text-muted-foreground text-xs">
        {copied ? "Copied!" : "Click code to copy"}
      </p>
      <div className="flex items-center gap-2">
        <Loader2Icon className="text-muted-foreground size-3 animate-spin" />
        <span className="text-muted-foreground text-sm">
          Waiting for authorization...
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        <XIcon className="size-4" />
        Cancel
      </Button>
    </div>
  );
}
