import {
  IconCreditCard,
  IconExternalLink,
  IconInfoCircle,
  IconLogout,
  IconPlus,
  IconRocket,
  IconX,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { AuthStatusDisplay } from "@/components/a1/web-auth/auth-status-display";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getBillingUsageSummary,
  isAgentOneAccountProvisioning,
} from "@/contexts/use-web-auth/web-auth-contexts";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { hideAgentOneModelsAtom, syncEnabledAtom } from "@/lib/jotai/atoms";
import { memoryAtom, systemPromptAppendixAtom, userNameAtom } from "@/lib/jotai/settings-atoms";
import { MAX_MEMORY_ENTRIES, MAX_MEMORY_ENTRY_CHARS, sanitizeMemoryEntry } from "@/lib/memory";

import SettingsTarget from "../settings-target";

const MAX_APPENDIX_CHARS = 2000;
const DASHBOARD_URL = "https://www.agent-one.dev/dashboard";
const BILLING_URL = `${DASHBOARD_URL}/billing`;
const UPGRADE_URL = `${BILLING_URL}?hint=upgrade`;

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(value);
}

export default function AccountSection() {
  const [userName, setUserName] = useAtom(userNameAtom);
  const [systemPromptAppendix, setSystemPromptAppendix] = useAtom(systemPromptAppendixAtom);
  const [memory, setMemory] = useAtom(memoryAtom);
  const [syncEnabled, setSyncEnabled] = useAtom(syncEnabledAtom);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [hideAgentOneModels, setHideAgentOneModels] = useAtom(hideAgentOneModelsAtom);
  const {
    user,
    isLoading: isAuthLoading,
    isSigningOut,
    signOut,
    customerState,
    billingLoading,
    billingError,
  } = useWebAuth();

  const activeSubscription = useMemo(
    () =>
      customerState?.subscriptions?.find(
        (subscription) => subscription.status === "active" || subscription.status === "trialing",
      ) ?? null,
    [customerState],
  );

  const currentPlanName = activeSubscription?.product?.name ?? "Free";
  const renewalDate = activeSubscription?.currentPeriodEnd
    ? new Date(activeSubscription.currentPeriodEnd).toLocaleDateString()
    : null;

  const usageSummary = useMemo(() => {
    return getBillingUsageSummary(customerState);
  }, [customerState]);

  const isAccountProvisioning =
    Boolean(user) &&
    !billingLoading &&
    !billingError &&
    isAgentOneAccountProvisioning(usageSummary);

  const handleAppendixChange = (value: string) => {
    setSystemPromptAppendix(value.slice(0, MAX_APPENDIX_CHARS));
  };

  const addMemoryEntry = () => {
    if (memory.length >= MAX_MEMORY_ENTRIES) return;
    if (memory.length > 0 && memory[memory.length - 1] === "") return;

    trackSettingsInteraction("account", "memory_entry_added", {
      entry_count: memory.length + 1,
    });
    setMemory((prev) => [...prev, ""]);
  };

  const updateMemoryEntry = (index: number, value: string) => {
    trackSettingsInteraction("account", "memory_changed", {
      value_length: value.length,
      entry_index: index,
    });

    setMemory((prev) =>
      prev.map((entry, entryIndex) => (entryIndex === index ? sanitizeMemoryEntry(value) : entry)),
    );
  };

  const removeMemoryEntry = (index: number) => {
    trackSettingsInteraction("account", "memory_entry_removed", {
      entry_index: index,
    });

    setMemory((prev) => prev.filter((_, entryIndex) => entryIndex !== index));
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Account, Sync &amp; Access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {isAuthLoading ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-52" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ) : (
            <AuthStatusDisplay
              signedInAction={
                user ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      analytics={{
                        event: "settings_external_link_clicked",
                        params: { section: "account", control: "account_dashboard" },
                      }}
                    >
                      <a href={DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
                        <IconExternalLink data-icon="inline-start" />
                        <span>Account</span>
                        <span className="sr-only lg:not-sr-only"> Dashboard</span>
                      </a>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={signOut}
                      disabled={isSigningOut}
                    >
                      <IconLogout data-icon="inline-start" />
                      <span>Sign out</span>
                    </Button>
                  </div>
                ) : undefined
              }
            />
          )}
          {(user || isAuthLoading) && (
            <div className="flex flex-col gap-4">
              {(isAuthLoading || billingLoading) && !customerState ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-6 w-44" />
                      <Skeleton className="h-5 w-36" />
                    </div>
                    <Skeleton className="h-8 w-28 shrink-0" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-8" />
                    </div>
                    <Skeleton className="h-1 w-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              ) : billingError ? (
                <p className="text-muted-foreground text-sm">{billingError}</p>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">You're on the {currentPlanName} Plan</p>
                      <p className="text-muted-foreground text-sm">
                        {activeSubscription
                          ? renewalDate
                            ? `Renews ${renewalDate}.`
                            : "Your subscription is active."
                          : "Upgrade to Pro for higher limits and premium features."}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      asChild
                      analytics={{
                        event: "settings_external_link_clicked",
                        params: {
                          section: "account",
                          control: activeSubscription ? "manage_billing" : "upgrade_plan",
                        },
                      }}
                    >
                      <a
                        href={activeSubscription ? BILLING_URL : UPGRADE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {activeSubscription ? (
                          <IconCreditCard data-icon="inline-start" />
                        ) : (
                          <IconRocket data-icon="inline-start" />
                        )}
                        <span>{activeSubscription ? "Manage Billing" : "Upgrade"}</span>
                      </a>
                    </Button>
                  </div>
                  {isAccountProvisioning ? (
                    <Alert>
                      <IconInfoCircle />
                      <AlertTitle>Account setup in progress</AlertTitle>
                      <AlertDescription>
                        Your account will be ready in a few minutes. AgentOne billing is still
                        finishing setup, so your credits have not appeared yet.
                      </AlertDescription>
                    </Alert>
                  ) : usageSummary ? (
                    <Field>
                      <FieldLabel htmlFor="credits-used">
                        <span>Credits used</span>
                        <span className="text-muted-foreground ml-auto">
                          {usageSummary.credited > 0
                            ? `${formatNumber((usageSummary.consumed / usageSummary.credited) * 100)}%`
                            : "0%"}
                        </span>
                      </FieldLabel>
                      <Progress
                        id="credits-used"
                        value={
                          usageSummary.credited > 0
                            ? Math.min((usageSummary.consumed / usageSummary.credited) * 100, 100)
                            : 0
                        }
                      />
                      <FieldDescription>
                        {formatNumber(usageSummary.remaining)} credits remaining this period.
                      </FieldDescription>
                    </Field>
                  ) : (
                    <p className="text-muted-foreground text-sm">No active usage meters.</p>
                  )}
                </>
              )}
            </div>
          )}
          <SettingsTarget id="setting-synchronize-my-settings">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="sync-enabled" className="text-sm font-medium">
                  Synchronize my settings
                </Label>
                <p className="text-muted-foreground text-sm">
                  Keep your settings in sync across devices using your AgentOne account.
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Switch
                      id="sync-enabled"
                      checked={syncEnabled}
                      onCheckedChange={(checked) => {
                        trackSettingsInteraction("account", "sync_enabled_toggled", {
                          enabled: checked,
                        });
                        setSyncEnabled(checked);
                      }}
                      disabled={!user}
                    />
                  </span>
                </TooltipTrigger>
                {!user && <TooltipContent>Sign in to enable sync</TooltipContent>}
              </Tooltip>
            </div>
          </SettingsTarget>
          <SettingsTarget id="setting-hide-agentone-models">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="hide-agentone-models" className="text-sm font-medium">
                  Hide AgentOne models
                </Label>
                <p className="text-muted-foreground text-sm">
                  Remove AgentOne models from the model selector.
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Switch
                      id="hide-agentone-models"
                      checked={hideAgentOneModels}
                      onCheckedChange={(checked) => {
                        trackSettingsInteraction("account", "hide_agentone_models_toggled", {
                          enabled: checked,
                        });
                        setHideAgentOneModels(checked);
                      }}
                      disabled={!user}
                    />
                  </span>
                </TooltipTrigger>
                {!user && (
                  <TooltipContent>You won't see AgentOne models unless signed-in</TooltipContent>
                )}
              </Tooltip>
            </div>
          </SettingsTarget>
          <p className="text-muted-foreground text-sm">
            Account analytics have moved to the{" "}
            <Link to="/settings?tab=about#setting-allow-usage-analytics" className="underline">
              Help &amp; Updates section
            </Link>
            .
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Profile &amp; Instructions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-your-name">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-name" className="text-sm font-medium">
                Your Name
              </Label>
              <p className="text-muted-foreground text-sm">
                AgentOne will use this name to address you.
              </p>
              <Input
                id="user-name"
                type="text"
                value={userName}
                onChange={(e) => {
                  trackSettingsInteraction("account", "user_name_changed", {
                    value_length: e.target.value.length,
                  });
                  setUserName(e.target.value);
                }}
                placeholder="Enter your name"
              />
            </div>
          </SettingsTarget>
          <SettingsTarget id="setting-ai-instructions">
            <div className="flex flex-col gap-2">
              <Label htmlFor="system-prompt-appendix" className="text-sm font-medium">
                AI Instructions
              </Label>
              <p className="text-muted-foreground text-sm">
                Add custom instructions that will be appended to the system prompt. These will guide
                how AgentOne responds to you.
              </p>
              <div className="relative">
                <Textarea
                  id="system-prompt-appendix"
                  value={systemPromptAppendix}
                  onChange={(e) => {
                    trackSettingsInteraction("account", "ai_instructions_changed", {
                      value_length: e.target.value.length,
                    });
                    handleAppendixChange(e.target.value);
                  }}
                  placeholder="e.g., Always use British English. Be concise and technical."
                  className="field-sizing-fixed max-h-96 min-h-15 resize-y"
                />
                <span className="text-muted-foreground pointer-events-none absolute right-2 bottom-2 text-xs">
                  {systemPromptAppendix.length} / {MAX_APPENDIX_CHARS}
                </span>
              </div>
            </div>
          </SettingsTarget>
          <SettingsTarget id="setting-memory">
            <div className="flex flex-col gap-2">
              <Label htmlFor="memory" className="text-sm font-medium">
                Memory
              </Label>
              <p className="text-muted-foreground text-sm">
                Save the things you want AgentOne to remember about you across chats, like your
                preferences, goals, or ongoing projects.
              </p>
              <div className="rounded-md border p-3">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="text-muted-foreground text-xs">
                    Keep each item short and specific so AgentOne can reuse it well.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMemoryEntry}
                    disabled={
                      memory.length >= MAX_MEMORY_ENTRIES ||
                      (memory.length > 0 && memory[memory.length - 1] === "")
                    }
                  >
                    <IconPlus data-icon="inline-start" />
                    Add
                  </Button>
                </div>
                {memory.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {memory.map((entry, index) => (
                      <div key={`memory-entry-${index}`} className="flex items-center gap-2">
                        <Input
                          id={index === 0 ? "memory" : undefined}
                          value={entry}
                          onChange={(e) => updateMemoryEntry(index, e.target.value)}
                          placeholder="e.g. I prefer concise technical answers"
                          maxLength={MAX_MEMORY_ENTRY_CHARS}
                          className="flex-1"
                        />
                        {entry ? (
                          <Popover
                            open={removingIndex === index}
                            onOpenChange={(open) => setRemovingIndex(open ? index : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                aria-label="Remove memory entry"
                              >
                                <IconX />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end">
                              <PopoverHeader>
                                <PopoverTitle>Delete this memory?</PopoverTitle>
                                <PopoverDescription>This cannot be undone.</PopoverDescription>
                              </PopoverHeader>
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setRemovingIndex(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    removeMemoryEntry(index);
                                    setRemovingIndex(null);
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeMemoryEntry(index)}
                            aria-label="Remove memory entry"
                          >
                            <IconX />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground flex h-20 items-center justify-center rounded-md border border-dashed p-2 text-sm">
                    Nothing saved yet.
                  </p>
                )}
              </div>
            </div>
          </SettingsTarget>
        </CardContent>
      </Card>
    </div>
  );
}
