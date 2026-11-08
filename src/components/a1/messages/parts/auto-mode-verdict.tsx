import { IconShieldX } from "@tabler/icons-react";
import type { DynamicToolUIPart, ToolUIPart } from "ai";

import { AUTO_MODE_BLOCKED_PREFIX, AUTO_MODE_BLOCKED_SUFFIX } from "@/lib/ai/tools/auto-mode";

type Approval = {
  approved?: boolean;
  reason?: string;
  isAutomatic?: boolean;
};

function getBlockedReason(reason: string | undefined) {
  if (!reason) return undefined;
  let text = reason;
  if (text.startsWith(AUTO_MODE_BLOCKED_PREFIX)) text = text.slice(AUTO_MODE_BLOCKED_PREFIX.length);
  if (text.endsWith(AUTO_MODE_BLOCKED_SUFFIX))
    text = text.slice(0, -AUTO_MODE_BLOCKED_SUFFIX.length);
  return text;
}

export function AutoModeVerdict({ part }: { part: ToolUIPart | DynamicToolUIPart }) {
  const approval = (part as { approval?: Approval }).approval;
  if (!approval?.isAutomatic || approval.approved !== false) return null;

  const reason = getBlockedReason(approval.reason);

  return (
    <div className="text-muted-foreground -mt-1.5 flex min-w-0 items-start gap-1 text-xs">
      <IconShieldX className="mt-px size-3.5 shrink-0" aria-hidden />
      <p className="min-w-0 wrap-break-word">
        <span className="font-medium">Auto mode blocked</span>
        {reason ? `: ${reason}` : null}
      </p>
    </div>
  );
}
