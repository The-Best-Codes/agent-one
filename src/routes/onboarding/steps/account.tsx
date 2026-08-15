import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AuthStatusDisplay } from "@/components/a1/web-auth/auth-status-display";
import { Button } from "@/components/ui/button";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { hasEnabledProviderAtom } from "@/lib/jotai/provider-atoms";
import { cn } from "@/lib/utils";
import { ProvidersList } from "@/routes/settings/sections/providers/providers-list";

interface AccountStepProps {
  onSubmit: () => void;
}

export function AccountStep({ onSubmit }: AccountStepProps) {
  const { t } = useTranslation();
  const { user } = useWebAuth();
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

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit();
    }, 500);
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
              {t("onboarding.configureProviders")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("onboarding.configureProvidersDescription")}
            </p>
          </div>

          <div className="max-h-[50svh] overflow-y-auto p-1">
            <ProvidersList />
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!hasEnabledProvider || isSubmitting}
              className="w-full"
            >
              {t("onboarding.finishSetup")}
            </Button>
            <Button variant="outline" onClick={() => handleViewChange("account")}>
              <IconArrowLeft data-icon="inline-start" />
              {t("onboarding.backToAccount")}
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
          <h2 className="text-foreground text-center text-4xl font-bold">
            {t("onboarding.setUpAccount")}
          </h2>
          <p className="text-muted-foreground text-center text-base">
            {t("onboarding.setUpAccountDescription")}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border-border rounded-md border p-4">
            <AuthStatusDisplay />
          </div>

          {user && (
            <Button size="lg" onClick={handleSubmit} disabled={isSubmitting}>
              {t("common.continue")}
              <IconArrowRight data-icon="inline-end" />
            </Button>
          )}

          <button
            type="button"
            className="text-muted-foreground hover:text-foreground mt-2 cursor-pointer text-sm underline"
            onClick={() => handleViewChange("byok")}
          >
            {t("onboarding.orContinueWithout")}
          </button>
        </div>
      </div>
    </div>
  );
}
