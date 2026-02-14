import { ArrowLeftIcon, ChevronRightIcon, KeyIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthStatusDisplay } from "@/components/a1/web-auth/auth-status-display";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { PROVIDER_REGISTRY } from "@/lib/ai/providers/registry";
import { useProviderState } from "@/lib/hooks/use-provider-state";
import {
  type ProviderConfig,
  type ProviderId,
} from "@/lib/jotai/provider-atoms";
import { cn } from "@/lib/utils";
import { ProviderListItem } from "@/routes/settings/sections/providers/provider-list-item";

interface AccountStepProps {
  onSubmit: () => void;
}

function ProviderItem({
  providerId,
  onEnabledChange,
}: {
  providerId: ProviderId;
  onEnabledChange: (providerId: ProviderId, enabled: boolean) => void;
}) {
  const provider = PROVIDER_REGISTRY.find((p) => p.id === providerId)!;
  const state = useProviderState(providerId);

  useEffect(() => {
    if (state.config.enabled) {
      onEnabledChange(providerId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfigChange = (updates: Partial<ProviderConfig>) => {
    state.setConfig(updates);
    if (updates.enabled !== undefined) {
      onEnabledChange(providerId, updates.enabled);
    }
  };

  const handleApiKeyChange = (key: string) => {
    void state.setApiKey(key);
  };

  return (
    <ProviderListItem
      providerId={providerId}
      label={provider.label}
      config={state.config}
      apiKey={state.apiKey}
      hasEnvKey={state.hasEnvKey}
      onConfigChange={handleConfigChange}
      onApiKeyChange={handleApiKeyChange}
    />
  );
}

export function AccountStep({ onSubmit }: AccountStepProps) {
  const { user } = useWebAuth();
  const [view, setView] = useState<"account" | "byok">("account");
  const [isExiting, setIsExiting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enabledProviders, setEnabledProviders] = useState<Set<ProviderId>>(
    new Set(),
  );

  useEffect(() => {
    if (user && view === "account") {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleViewChange = (newView: "account" | "byok") => {
    setIsExiting(true);
    setTimeout(() => {
      setView(newView);
      setIsExiting(false);
    }, 500);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit();
    }, 500);
  };

  const handleEnabledChange = (providerId: ProviderId, enabled: boolean) => {
    setEnabledProviders((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(providerId);
      } else {
        next.delete(providerId);
      }
      return next;
    });
  };

  if (view === "byok") {
    return (
      <div
        key="byok"
        className={cn(
          "w-full max-w-xl px-4 duration-500",
          isSubmitting
            ? "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards"
            : isExiting
              ? "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards"
              : "animate-in slide-in-from-bottom-5 fade-in-0",
        )}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-foreground text-2xl font-bold">
              Configure providers
            </h2>
            <p className="text-muted-foreground text-sm">
              Your API keys are stored securely on your device. Enable providers
              and configure their API keys to get started.
            </p>
          </div>

          <Accordion
            type="single"
            collapsible
            className="border-border max-h-[50svh] w-full overflow-y-auto rounded-md border"
          >
            {PROVIDER_REGISTRY.map((provider) => (
              <ProviderItem
                key={provider.id}
                providerId={provider.id}
                onEnabledChange={handleEnabledChange}
              />
            ))}
          </Accordion>

          <div className="mt-2 flex flex-col gap-3">
            <Button
              onClick={handleSubmit}
              disabled={enabledProviders.size < 1 || isSubmitting}
              className="w-full"
            >
              Finish Setup
            </Button>
            <Button
              variant="outline"
              onClick={() => handleViewChange("account")}
            >
              <ArrowLeftIcon className="size-4" />
              Back to account options
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key="account"
      className={cn(
        "w-full max-w-md px-4 duration-500",
        isExiting
          ? "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards"
          : "animate-in slide-in-from-bottom-5 fade-in-0",
      )}
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-center text-4xl font-bold">
            Set up your account
          </h2>
          <p className="text-muted-foreground text-center text-base">
            An AgentOne account synchronizes your data across devices and allows
            you to access AgentOne models.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="border-border rounded-lg border p-4">
            <AuthStatusDisplay />
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="border-border w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-4">
                Or
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="h-16 justify-between px-6 text-xl"
            onClick={() => handleViewChange("byok")}
          >
            <span className="flex items-center gap-2">
              <div className="rounded-md p-2">
                <KeyIcon className="text-foreground size-6" />
              </div>
              Continue without an account
            </span>
            <ChevronRightIcon className="text-muted-foreground size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
