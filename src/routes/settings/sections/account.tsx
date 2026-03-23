import { IconCreditCard, IconRocket } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useMemo } from "react";

import { AuthStatusDisplay } from "@/components/a1/web-auth/auth-status-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { hideAgentOneModelsAtom, syncEnabledAtom } from "@/lib/jotai/atoms";
import { systemPromptAppendixAtom, userNameAtom } from "@/lib/jotai/settings-atoms";

const MAX_APPENDIX_CHARS = 2000;
const BILLING_URL = "https://www.agent-one.dev/dashboard/billing";
const UPGRADE_URL = `${BILLING_URL}?upgrade=pro`;

export default function AccountSection() {
  const [userName, setUserName] = useAtom(userNameAtom);
  const [systemPromptAppendix, setSystemPromptAppendix] = useAtom(systemPromptAppendixAtom);
  const [syncEnabled, setSyncEnabled] = useAtom(syncEnabledAtom);
  const [hideAgentOneModels, setHideAgentOneModels] = useAtom(hideAgentOneModelsAtom);
  const {
    user,
    isLoading: isAuthLoading,
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

  const handleAppendixChange = (value: string) => {
    setSystemPromptAppendix(value.slice(0, MAX_APPENDIX_CHARS));
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {(isAuthLoading || billingLoading) && !customerState ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : !user ? (
            <div className="flex flex-col gap-1">
              <p className="font-medium">Free</p>
              <p className="text-muted-foreground text-sm">
                Sign in to load your current subscription and manage billing.
              </p>
            </div>
          ) : billingError ? (
            <p className="text-muted-foreground text-sm">{billingError}</p>
          ) : activeSubscription ? (
            <div className="flex flex-col gap-1">
              <p className="font-medium">{currentPlanName}</p>
              <p className="text-muted-foreground text-sm">
                {renewalDate ? `Renews ${renewalDate}.` : "Your subscription is active."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="font-medium">Free</p>
              <p className="text-muted-foreground text-sm">
                Upgrade to Pro for higher limits and premium features.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          {!billingLoading && user && !billingError && !activeSubscription && (
            <Button size="sm" asChild>
              <a href={UPGRADE_URL} target="_blank" rel="noopener noreferrer">
                <IconRocket data-icon="inline-start" />
                <span>Upgrade your Plan</span>
              </a>
            </Button>
          )}
          {!billingLoading && user && !billingError && activeSubscription && (
            <Button variant="outline" size="sm" asChild>
              <a href={BILLING_URL} target="_blank" rel="noopener noreferrer">
                <IconCreditCard data-icon="inline-start" />
                <span>Manage Billing</span>
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sync &amp; Access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <AuthStatusDisplay />
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
                    onCheckedChange={setSyncEnabled}
                    disabled={!user}
                  />
                </span>
              </TooltipTrigger>
              {!user && <TooltipContent>Sign in to enable sync</TooltipContent>}
            </Tooltip>
          </div>
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
                    onCheckedChange={setHideAgentOneModels}
                    disabled={!user}
                  />
                </span>
              </TooltipTrigger>
              {!user && <TooltipContent>Sign in to hide AgentOne models</TooltipContent>}
            </Tooltip>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Profile &amp; Instructions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
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
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
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
                onChange={(e) => handleAppendixChange(e.target.value)}
                placeholder="e.g., Always use British English. Be concise and technical."
                className="field-sizing-fixed max-h-96 min-h-15 resize-y"
              />
              <span className="text-muted-foreground pointer-events-none absolute right-2 bottom-2 text-xs">
                {systemPromptAppendix.length} / {MAX_APPENDIX_CHARS}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
