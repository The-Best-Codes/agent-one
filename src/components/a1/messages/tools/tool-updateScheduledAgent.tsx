import { IconCalendarCog } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";

import { ScheduledAgentToolUi } from "./scheduled-agent-tool-ui";

export const MessagePartToolUpdateScheduledAgent = ({ part }: { part: ToolUIPart }) => (
  <ScheduledAgentToolUi
    part={part}
    verb="update scheduled agent"
    active="Updating scheduled agent"
    complete="Updated scheduled agent"
    IconComponent={IconCalendarCog}
  />
);
