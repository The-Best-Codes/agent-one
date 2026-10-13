import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useState } from "react";

import { AuthStatusDisplay } from "@/components/a1/web-auth/auth-status-display";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { hasEnabledProviderAtom } from "@/lib/jotai/provider-atoms";
import { cn } from "@/lib/utils";
import { SettingsSectionCards } from "@/routes/settings/settings-renderer";

interface AccountStepProps {
  onSignedIn: () => void;
  onContinueWithoutAccount: () => void;
}

export function AccountStep({ onSignedIn, onContinueWithoutAccount }: AccountStepProps) {
  const { user, isLoading, isSigningIn } = useWebAuth();
  const [view, setView] = useState<"account" | "byok">("account");
  const [isExiting, setIsExiting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasEnabledProvider = useAtomValue(hasEnabledProviderAtom);

  const handleViewChange = (newView: "account" | "byok") => {
    setIsExiting(true);
    setTimeout(() => {
      setView(newView);
      setIsExiting(false);
    }, 500);
  };

  const exitThen = (callback: () => void) => {
    setIsSubmitting(true);
    setTimeout(callback, 500);
  };

  if (view === "byok") {
    return (
      <div
        key="byok"
        className={cn(
          "h-svh w-full max-w-xl px-4 py-6 duration-500",
          isSubmitting
            ? "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards"
            : isExiting
              ? "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards"
              : "animate-in slide-in-from-bottom-5 fade-in-0",
        )}
      >
        <div className="flex h-full flex-col gap-4">
          <div className="flex flex-col">
            <h2 className="text-foreground text-2xl font-bold">Configure providers</h2>
            <p className="text-muted-foreground text-sm">
              Configure a provider and enable it to continue.
            </p>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-4">
              <SettingsSectionCards sectionId="providers" />
            </div>
          </ScrollArea>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => handleViewChange("account")}
              className="sm:flex-1"
            >
              <IconArrowLeft data-icon="inline-start" />
              Back to account options
            </Button>
            <Button
              onClick={() => exitThen(onContinueWithoutAccount)}
              disabled={!hasEnabledProvider || isSubmitting}
              className="sm:flex-1"
            >
              Continue
              <IconArrowRight data-icon="inline-end" />
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
        "w-full max-w-xl px-4 duration-500",
        isSubmitting || isExiting
          ? "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards"
          : "animate-in slide-in-from-bottom-5 fade-in-0",
      )}
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-center text-4xl font-bold">Set up your account</h2>
          <p className="text-muted-foreground text-center text-base">
            An AgentOne account synchronizes your data across devices and allows you to access
            AgentOne models.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border-border rounded-md border p-4">
            <AuthStatusDisplay />
          </div>

          {user ? (
            <Button size="lg" onClick={() => exitThen(onSignedIn)} disabled={isSubmitting}>
              Continue
              <IconArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            !isLoading &&
            !isSigningIn && (
              <Button variant="link" onClick={() => handleViewChange("byok")}>
                I want to use my own API keys instead
                <IconArrowRight data-icon="inline-end" />
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
