import { IconList } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";

import { ScheduledAgentToolUi } from "./scheduled-agent-tool-ui";

export const MessagePartToolListScheduledAgents = ({ part }: { part: ToolUIPart }) => (
  <ScheduledAgentToolUi
    part={part}
    verb="list scheduled agents"
    active="Listing scheduled agents"
    complete="Listed scheduled agents"
    IconComponent={IconList}
  />
);
