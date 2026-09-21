import { IconCalendarPlus } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";

import { ScheduledAgentToolUi } from "./scheduled-agent-tool-ui";

export const MessagePartToolCreateScheduledAgent = ({ part }: { part: ToolUIPart }) => (
  <ScheduledAgentToolUi
    part={part}
    verb="create scheduled agent"
    active="Creating scheduled agent"
    complete="Created scheduled agent"
    IconComponent={IconCalendarPlus}
  />
);
