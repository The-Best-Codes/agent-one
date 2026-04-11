import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { type McpServerLoadState } from "@/lib/jotai/mcp-atoms";

interface McpServerApprovalSettingsProps {
  idPrefix: string;
  enabled: boolean;
  requiresApproval: boolean;
  toolApprovalOverrides?: Record<string, boolean>;
  loadState?: McpServerLoadState;
  approvalDescription: string;
  onRequiresApprovalChange: (requiresApproval: boolean) => void;
  onToolApprovalOverridesChange: (overrides: Record<string, boolean>) => void;
}

export function McpServerApprovalSettings({
  idPrefix,
  enabled,
  requiresApproval,
  toolApprovalOverrides,
  loadState,
  approvalDescription,
  onRequiresApprovalChange,
  onToolApprovalOverridesChange,
}: McpServerApprovalSettingsProps) {
  const availableTools = loadState?.toolNames ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <Label htmlFor={`${idPrefix}-requires-approval`} className="text-sm">
            Require Approval By Default
          </Label>
          <span className="text-muted-foreground text-xs">{approvalDescription}</span>
        </div>
        <Switch
          id={`${idPrefix}-requires-approval`}
          checked={requiresApproval}
          onCheckedChange={onRequiresApprovalChange}
        />
      </div>

      <Accordion type="single" collapsible className="rounded-md border px-3">
        <AccordionItem value="tool-approval" className="border-b-0">
          <AccordionTrigger className="py-3 text-sm">Per-tool approvals</AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="flex flex-col gap-3">
              {!enabled ? (
                <span className="text-muted-foreground text-sm">
                  Enable this server to configure per-tool approvals.
                </span>
              ) : loadState?.status === "starting" ||
                loadState?.status === "connecting" ||
                loadState?.status === "unknown" ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Spinner className="size-4" />
                  Tool list will appear after the server finishes loading.
                </div>
              ) : loadState?.status === "error" ? (
                <span className="text-muted-foreground text-sm">
                  Tools could not be loaded yet. Resolve the server error to configure per-tool
                  approvals.
                </span>
              ) : availableTools.length === 0 ? (
                <span className="text-muted-foreground text-sm">
                  This server does not currently expose any tools.
                </span>
              ) : (
                availableTools.map((toolName) => {
                  const override = toolApprovalOverrides?.[toolName];
                  const toolRequiresApproval = override ?? requiresApproval;

                  return (
                    <div key={toolName} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{toolName}</span>
                        <span className="text-muted-foreground text-xs">
                          {override === undefined
                            ? `Using default: ${requiresApproval ? "approval required" : "no approval required"}`
                            : toolRequiresApproval
                              ? "Approval required"
                              : "No approval required"}
                        </span>
                      </div>
                      <Switch
                        checked={toolRequiresApproval}
                        onCheckedChange={(checked) => {
                          const nextOverrides = { ...(toolApprovalOverrides ?? {}) };

                          if (checked === requiresApproval) {
                            delete nextOverrides[toolName];
                          } else {
                            nextOverrides[toolName] = checked;
                          }

                          onToolApprovalOverridesChange(nextOverrides);
                        }}
                        aria-label={`Toggle approval for ${toolName}`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
