import {
  IconCreditCard,
  IconExternalLink,
  IconInfoCircle,
  IconLogout,
  IconRocket,
} from "@tabler/icons-react";
import { useEffect, useMemo } from "react";

import { AuthStatusDisplay } from "@/components/a1/web-auth/auth-status-display";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getActivePaidSubscription,
  getBillingUsageSummary,
  getPlanNameForSubscription,
  isAgentOneAccountProvisioning,
} from "@/contexts/use-web-auth/web-auth-contexts";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";

const DASHBOARD_URL = "https://www.agent-one.dev/dashboard";
const BILLING_URL = `${DASHBOARD_URL}/billing`;
const UPGRADE_URL = `${BILLING_URL}?hint=upgrade`;

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(value);
}

export default function AccountOverview() {
  const {
    user,
    isLoading: isAuthLoading,
    isSigningOut,
    signOut,
    customerState,
    billingLoading,
    billingError,
    refreshBilling,
  } = useWebAuth();

  useEffect(() => {
    refreshBilling();
  }, [refreshBilling]);

  const activeSubscription = useMemo(
    () => getActivePaidSubscription(customerState),
    [customerState],
  );

  const currentPlanName = activeSubscription
    ? getPlanNameForSubscription(activeSubscription)
    : "Free";

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

  return (
    <>
      {isAuthLoading ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
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
                    <span className="sr-only lg:not-sr-only">{" Dashboard"}</span>
                  </a>
                </Button>
                <Button variant="destructive" size="sm" onClick={signOut} disabled={isSigningOut}>
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
          {isAuthLoading || billingLoading || (user && !customerState) ? (
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
                  <p className="font-medium">{`You're on the ${currentPlanName} Plan`}</p>
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
                    Your account will be ready in a few minutes. AgentOne billing is still finishing
                    setup, so your credits have not appeared yet.
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
                    {`${formatNumber(usageSummary.remaining)} credits remaining this period.`}
                  </FieldDescription>
                </Field>
              ) : (
                <p className="text-muted-foreground text-sm">No active usage meters.</p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
