import { MonitorSmartphoneIcon } from "lucide-react";

import { CopyButton } from "@/components/a1/copy-button";
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
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3">
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
          <MonitorSmartphoneIcon className="text-primary size-5" />
        </div>
        <div>
          <p className="leading-none font-medium">Link this device</p>
          <p className="text-muted-foreground font-mono text-sm font-bold tracking-wider">
            {deviceFlow.userCode}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CopyButton
          text={deviceFlow.userCode}
          size="sm"
          variants={{
            idle: "secondary",
            copying: "secondary",
            success: "secondary",
            error: "secondary",
          }}
        />
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
