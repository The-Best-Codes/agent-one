import { IconRestore } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";

import { SearchInput } from "@/components/a1/search-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { enabledToolsAtom, toolConfigsAtom } from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";

import SettingsTarget from "../../settings-target";
import { ToolListItem } from "./tool-list-item";
import { BUILT_IN_TOOLS, TOOL_IDS, getMergedToolConfigs } from "./tools-metadata";

export function ToolsList() {
  const [query, setQuery] = useState("");
  const enabledTools = useAtomValue(enabledToolsAtom);
  const toolConfigs = useAtomValue(toolConfigsAtom);

  const isDefault =
    JSON.stringify({
      enabledTools: { ...DEFAULT_SETTINGS.ENABLED_TOOLS, ...enabledTools },
      toolConfigs: getMergedToolConfigs(toolConfigs),
    }) ===
    JSON.stringify({
      enabledTools: DEFAULT_SETTINGS.ENABLED_TOOLS,
      toolConfigs: DEFAULT_SETTINGS.TOOL_CONFIGS,
    });

  const filteredToolIds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return TOOL_IDS;
    }

    return TOOL_IDS.filter((toolId) => {
      const tool = BUILT_IN_TOOLS[toolId];
      return `${tool.name} ${tool.description} ${tool.searchTerms}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [query]);

  const handleResetTools = () => {
    trackSettingsInteraction("tools", "reset_tools");
    resetSetting("ENABLED_TOOLS");
    resetSetting("TOOL_CONFIGS");
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingsTarget id="setting-built-in-tools">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Tools</CardTitle>
            <CardDescription>
              Choose which tools AgentOne can use and how each one behaves.
            </CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetTools}
                disabled={isDefault}
                aria-label="Reset tools to defaults"
              >
                <IconRestore />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SearchInput
              placeholder="Search tools..."
              value={query}
              onChange={(event) => {
                trackSettingsInteraction("tools", "search_changed", {
                  value_length: event.target.value.length,
                });
                setQuery(event.target.value);
              }}
            />

            {filteredToolIds.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filteredToolIds.map((toolId) => (
                  <ToolListItem key={toolId} toolId={toolId} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No tools match your search.
              </p>
            )}
          </CardContent>
        </Card>
      </SettingsTarget>
    </div>
  );
}
