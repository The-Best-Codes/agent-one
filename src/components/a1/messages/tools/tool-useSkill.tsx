import { IconBook, IconCircleX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface UseSkillOutput {
  skills?: unknown[];
}

export const MessagePartToolUseSkill = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return (
        <div key={callId} className="flex items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Looking for skills...</span>
        </div>
      );

    case "output-available": {
      const count = (part.output as UseSkillOutput | undefined)?.skills?.length ?? 0;
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconBook className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">
            {count === 0
              ? "No skills found"
              : count === 1
                ? "Found 1 skill"
                : `Found ${count} skills`}
          </span>
        </div>
      );
    }

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Looking for skills was cancelled
            </span>
          </div>
        );
      }
      return (
        <ToolErrorAccordion
          callId={callId}
          errorText={part.errorText}
          isOpen={isErrorAccordionOpen}
          onOpenChange={setIsErrorAccordionOpen}
          title="Couldn't look for skills"
        />
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconBook className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Looked for skills</span>
        </div>
      );
  }
};

MessagePartToolUseSkill.displayName = "MessagePartToolUseSkill";
