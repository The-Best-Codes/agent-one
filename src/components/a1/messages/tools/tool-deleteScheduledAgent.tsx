import { IconCalendarX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";

import { ScheduledAgentToolUi } from "./scheduled-agent-tool-ui";

export const MessagePartToolDeleteScheduledAgent = ({ part }: { part: ToolUIPart }) => (
  <ScheduledAgentToolUi
    part={part}
    verb="delete scheduled agent"
    active="Deleting scheduled agent"
    complete="Deleted scheduled agent"
    IconComponent={IconCalendarX}
  />
);
