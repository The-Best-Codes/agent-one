import { useAtom } from "jotai";
import { RotateCcwIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { enabledToolsAtom, toolConfigsAtom } from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import {
  DEFAULT_SETTINGS,
  type ToolConfigs,
  type ToolId,
} from "@/lib/settings/types";

const TOOL_NAMES: Record<ToolId, string> = {
  dateTime: "Date & Time",
  waitNumberMilliseconds: "Wait Milliseconds",
  getUrlContent: "Get URL Content",
  webSearch: "Web Search",
};

const TOOL_DESCRIPTIONS: Record<ToolId, string> = {
  dateTime: "Get the current date and time",
  waitNumberMilliseconds: "Wait for a specified duration",
  getUrlContent: "Fetch and extract content from URLs",
  webSearch: "Search the web for information",
};

export default function ToolsSection() {
  const [enabledTools, setEnabledTools] = useAtom(enabledToolsAtom);
  const [toolConfigs, setToolConfigs] = useAtom(toolConfigsAtom);

  const isToolConfigsDefault =
    JSON.stringify({ enabledTools, toolConfigs }) ===
    JSON.stringify({
      enabledTools: DEFAULT_SETTINGS.ENABLED_TOOLS,
      toolConfigs: DEFAULT_SETTINGS.TOOL_CONFIGS,
    });

  const handleResetToolConfigs = () => {
    resetSetting("ENABLED_TOOLS");
    resetSetting("TOOL_CONFIGS");
  };

  const updateToolEnabled = (toolId: ToolId, enabled: boolean) => {
    setEnabledTools((prev) => ({ ...prev, [toolId]: enabled }));
  };

  const updateToolConfig = <T extends ToolId>(
    toolId: T,
    updates: Partial<ToolConfigs[T]>,
  ) => {
    setToolConfigs((prev) => ({
      ...prev,
      [toolId]: { ...prev[toolId], ...updates },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Static Tools</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col items-start">
            <Label className="text-sm font-medium">Tool Configuration</Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Configure which built-in tools are available and their settings.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetToolConfigs}
            disabled={isToolConfigsDefault}
            aria-label="Reset to default"
          >
            <RotateCcwIcon className="size-4" />
          </Button>
        </div>

        <Accordion
          type="single"
          collapsible
          className="border-border w-full rounded-md border"
        >
          {(Object.keys(TOOL_NAMES) as ToolId[]).map((toolId) => (
            <AccordionItem key={toolId} value={toolId}>
              <div className="flex items-center gap-3 px-3 [&>h3]:flex-1">
                <Checkbox
                  id={`enabled-${toolId}`}
                  checked={enabledTools[toolId]}
                  onCheckedChange={(checked) =>
                    updateToolEnabled(toolId, checked as boolean)
                  }
                />
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">
                      {TOOL_NAMES[toolId]}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {TOOL_DESCRIPTIONS[toolId]}
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
                      checked={toolConfigs[toolId].requiresApproval}
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
                        checked={toolConfigs.dateTime.useUtc}
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
                          max={toolConfigs.waitNumberMilliseconds.maxMs}
                          value={toolConfigs.waitNumberMilliseconds.minMs}
                          onChange={(e) =>
                            updateToolConfig("waitNumberMilliseconds", {
                              minMs: Math.max(
                                0,
                                Math.min(
                                  parseInt(e.target.value) || 0,
                                  toolConfigs.waitNumberMilliseconds.maxMs,
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
                          min={toolConfigs.waitNumberMilliseconds.minMs}
                          max={600000}
                          value={toolConfigs.waitNumberMilliseconds.maxMs}
                          onChange={(e) =>
                            updateToolConfig("waitNumberMilliseconds", {
                              maxMs: Math.max(
                                toolConfigs.waitNumberMilliseconds.minMs,
                                Math.min(
                                  parseInt(e.target.value) || 60000,
                                  600000,
                                ),
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
                            max={toolConfigs.getUrlContent.maxUrls}
                            value={toolConfigs.getUrlContent.minUrls}
                            onChange={(e) =>
                              updateToolConfig("getUrlContent", {
                                minUrls: Math.max(
                                  1,
                                  Math.min(
                                    parseInt(e.target.value) || 1,
                                    toolConfigs.getUrlContent.maxUrls,
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
                            min={toolConfigs.getUrlContent.minUrls}
                            max={200}
                            value={toolConfigs.getUrlContent.maxUrls}
                            onChange={(e) =>
                              updateToolConfig("getUrlContent", {
                                maxUrls: Math.max(
                                  toolConfigs.getUrlContent.minUrls,
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
                          value={toolConfigs.getUrlContent.defaultMaxLength}
                          onChange={(e) =>
                            updateToolConfig("getUrlContent", {
                              defaultMaxLength: Math.max(
                                100,
                                Math.min(
                                  parseInt(e.target.value) || 1000,
                                  50000,
                                ),
                              ),
                            })
                          }
                        />
                      </div>
                    </>
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
                          value={toolConfigs.webSearch.maxConcurrent}
                          onChange={(e) =>
                            updateToolConfig("webSearch", {
                              maxConcurrent: Math.max(
                                1,
                                Math.min(parseInt(e.target.value) || 3, 50),
                              ),
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
                            value={toolConfigs.webSearch.defaultMaxResults}
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
                            value={toolConfigs.webSearch.defaultMaxPages}
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
      </CardContent>
    </Card>
  );
}
