import { IconRestore } from "@tabler/icons-react";
import { useAtom } from "jotai";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { enabledToolsAtom, toolConfigsAtom } from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import { DEFAULT_SETTINGS, type ToolConfigs, type ToolId } from "@/lib/settings/types";

import { BUILT_IN_TOOLS, TOOL_IDS } from "./built-in-extensions-utils";

export function BuiltInExtensionsConfig() {
  const [enabledTools, setEnabledTools] = useAtom(enabledToolsAtom);
  const [toolConfigs, setToolConfigs] = useAtom(toolConfigsAtom);
  const mergedEnabledTools = { ...DEFAULT_SETTINGS.ENABLED_TOOLS, ...enabledTools };
  const mergedToolConfigs = {
    ...DEFAULT_SETTINGS.TOOL_CONFIGS,
    ...toolConfigs,
  } satisfies ToolConfigs;

  const isToolConfigsDefault =
    JSON.stringify({ enabledTools: mergedEnabledTools, toolConfigs: mergedToolConfigs }) ===
    JSON.stringify({
      enabledTools: DEFAULT_SETTINGS.ENABLED_TOOLS,
      toolConfigs: DEFAULT_SETTINGS.TOOL_CONFIGS,
    });

  const handleResetToolConfigs = () => {
    trackSettingsInteraction("extensions", "reset_built_in_extensions");
    resetSetting("ENABLED_TOOLS");
    resetSetting("TOOL_CONFIGS");
  };

  const updateToolEnabled = (toolId: ToolId, enabled: boolean) => {
    trackSettingsInteraction("extensions", "built_in_tool_toggled", {
      tool_id: toolId,
      enabled,
    });
    setEnabledTools((prev) => ({ ...prev, [toolId]: enabled }));
  };

  const updateToolConfig = <T extends ToolId>(toolId: T, updates: Partial<ToolConfigs[T]>) => {
    trackSettingsInteraction("extensions", "built_in_tool_config_changed", {
      tool_id: toolId,
    });
    setToolConfigs((prev) => ({
      ...prev,
      [toolId]: { ...prev[toolId], ...updates },
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-start">
          <Label className="text-sm font-medium">Built-in tools</Label>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose which built-in tools are available and how they behave.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleResetToolConfigs}
          disabled={isToolConfigsDefault}
          aria-label="Reset to default"
        >
          <IconRestore data-icon="inline-start" />
        </Button>
      </div>

      <Accordion type="single" collapsible className="border-border w-full rounded-md border">
        {TOOL_IDS.map((toolId) => (
          <AccordionItem key={toolId} value={toolId}>
            <div className="flex items-center gap-3 px-3 [&>h3]:flex-1">
              <Checkbox
                id={`enabled-${toolId}`}
                checked={mergedEnabledTools[toolId]}
                onCheckedChange={(checked) => updateToolEnabled(toolId, checked as boolean)}
                aria-label={`Enable ${BUILT_IN_TOOLS[toolId].name}`}
              />
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">{BUILT_IN_TOOLS[toolId].name}</span>
                  <span className="text-muted-foreground text-xs">
                    {BUILT_IN_TOOLS[toolId].description}
                  </span>
                </div>
              </AccordionTrigger>
            </div>
            <AccordionContent className="px-3 pb-3">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label htmlFor={`approval-${toolId}`} className="text-sm">
                      Require Approval
                    </Label>
                    <span className="text-muted-foreground text-xs">
                      Ask for confirmation before running this tool
                    </span>
                  </div>
                  <Switch
                    id={`approval-${toolId}`}
                    checked={mergedToolConfigs[toolId].requiresApproval}
                    onCheckedChange={(checked) =>
                      updateToolConfig(toolId, {
                        requiresApproval: checked,
                      })
                    }
                  />
                </div>

                {toolId === "dateTime" && (
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <Label htmlFor="dateTime-utc" className="text-sm">
                        Use UTC
                      </Label>
                      <span className="text-muted-foreground text-xs">
                        Return time in UTC instead of local timezone
                      </span>
                    </div>
                    <Switch
                      id="dateTime-utc"
                      checked={mergedToolConfigs.dateTime.useUtc}
                      onCheckedChange={(checked) =>
                        updateToolConfig("dateTime", { useUtc: checked })
                      }
                    />
                  </div>
                )}

                {toolId === "waitNumberMilliseconds" && (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="grid flex-1 gap-1.5">
                      <Label htmlFor="wait-min" className="text-xs">
                        Min Duration (ms)
                      </Label>
                      <Input
                        id="wait-min"
                        type="number"
                        min={0}
                        max={mergedToolConfigs.waitNumberMilliseconds.maxMs}
                        value={mergedToolConfigs.waitNumberMilliseconds.minMs}
                        onChange={(e) =>
                          updateToolConfig("waitNumberMilliseconds", {
                            minMs: Math.max(
                              0,
                              Math.min(
                                parseInt(e.target.value) || 0,
                                mergedToolConfigs.waitNumberMilliseconds.maxMs,
                              ),
                            ),
                          })
                        }
                      />
                    </div>
                    <div className="grid flex-1 gap-1.5">
                      <Label htmlFor="wait-max" className="text-xs">
                        Max Duration (ms)
                      </Label>
                      <Input
                        id="wait-max"
                        type="number"
                        min={mergedToolConfigs.waitNumberMilliseconds.minMs}
                        max={600000}
                        value={mergedToolConfigs.waitNumberMilliseconds.maxMs}
                        onChange={(e) =>
                          updateToolConfig("waitNumberMilliseconds", {
                            maxMs: Math.max(
                              mergedToolConfigs.waitNumberMilliseconds.minMs,
                              Math.min(parseInt(e.target.value) || 60000, 600000),
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {toolId === "getUrlContent" && (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="grid flex-1 gap-1.5">
                        <Label htmlFor="url-min" className="text-xs">
                          Min URLs
                        </Label>
                        <Input
                          id="url-min"
                          type="number"
                          min={1}
                          max={mergedToolConfigs.getUrlContent.maxUrls}
                          value={mergedToolConfigs.getUrlContent.minUrls}
                          onChange={(e) =>
                            updateToolConfig("getUrlContent", {
                              minUrls: Math.max(
                                1,
                                Math.min(
                                  parseInt(e.target.value) || 1,
                                  mergedToolConfigs.getUrlContent.maxUrls,
                                ),
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="grid flex-1 gap-1.5">
                        <Label htmlFor="url-max" className="text-xs">
                          Max URLs
                        </Label>
                        <Input
                          id="url-max"
                          type="number"
                          min={mergedToolConfigs.getUrlContent.minUrls}
                          max={200}
                          value={mergedToolConfigs.getUrlContent.maxUrls}
                          onChange={(e) =>
                            updateToolConfig("getUrlContent", {
                              maxUrls: Math.max(
                                mergedToolConfigs.getUrlContent.minUrls,
                                Math.min(parseInt(e.target.value) || 5, 200),
                              ),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="url-maxlength" className="text-xs">
                        Default Max Content Length
                      </Label>
                      <Input
                        id="url-maxlength"
                        type="number"
                        min={100}
                        max={50000}
                        value={mergedToolConfigs.getUrlContent.defaultMaxLength}
                        onChange={(e) =>
                          updateToolConfig("getUrlContent", {
                            defaultMaxLength: Math.max(
                              100,
                              Math.min(parseInt(e.target.value) || 1000, 50000),
                            ),
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {toolId === "viewFile" && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="viewFile-maxchars" className="text-xs">
                      Default Max Characters
                    </Label>
                    <Input
                      id="viewFile-maxchars"
                      type="number"
                      min={100}
                      max={100000}
                      value={mergedToolConfigs.viewFile.defaultMaxChars}
                      onChange={(e) =>
                        updateToolConfig("viewFile", {
                          defaultMaxChars: Math.max(
                            100,
                            Math.min(parseInt(e.target.value) || 10000, 100000),
                          ),
                        })
                      }
                    />
                  </div>
                )}

                {toolId === "executeCommand" && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="executeCommand-timeout" className="text-xs">
                      Default Timeout (ms)
                    </Label>
                    <Input
                      id="executeCommand-timeout"
                      type="number"
                      min={1000}
                      max={600000}
                      value={mergedToolConfigs.executeCommand.defaultTimeoutMs}
                      onChange={(e) =>
                        updateToolConfig("executeCommand", {
                          defaultTimeoutMs: Math.max(
                            1000,
                            Math.min(parseInt(e.target.value) || 120000, 600000),
                          ),
                        })
                      }
                    />
                  </div>
                )}

                {toolId === "subAgent" && (
                  <div className="text-muted-foreground text-xs">
                    Subagents inherit the current model and enabled tools, but cannot spawn other
                    subagents.
                  </div>
                )}

                {toolId === "webSearch" && (
                  <>
                    <div className="grid gap-1.5">
                      <Label htmlFor="search-concurrent" className="text-xs">
                        Max Concurrent Searches
                      </Label>
                      <Input
                        id="search-concurrent"
                        type="number"
                        min={1}
                        max={50}
                        value={mergedToolConfigs.webSearch.maxConcurrent}
                        onChange={(e) =>
                          updateToolConfig("webSearch", {
                            maxConcurrent: Math.max(1, Math.min(parseInt(e.target.value) || 3, 50)),
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="grid flex-1 gap-1.5">
                        <Label htmlFor="search-results" className="text-xs">
                          Default Max Results
                        </Label>
                        <Input
                          id="search-results"
                          type="number"
                          min={1}
                          max={200}
                          value={mergedToolConfigs.webSearch.defaultMaxResults}
                          onChange={(e) =>
                            updateToolConfig("webSearch", {
                              defaultMaxResults: Math.max(
                                1,
                                Math.min(parseInt(e.target.value) || 20, 200),
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="grid flex-1 gap-1.5">
                        <Label htmlFor="search-pages" className="text-xs">
                          Default Max Pages
                        </Label>
                        <Input
                          id="search-pages"
                          type="number"
                          min={1}
                          max={20}
                          value={mergedToolConfigs.webSearch.defaultMaxPages}
                          onChange={(e) =>
                            updateToolConfig("webSearch", {
                              defaultMaxPages: Math.max(
                                1,
                                Math.min(parseInt(e.target.value) || 1, 20),
                              ),
                            })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
