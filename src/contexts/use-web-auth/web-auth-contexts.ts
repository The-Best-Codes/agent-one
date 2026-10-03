import type { models } from "@polar-sh/sdk/2026-10";
import { createContext } from "react";

import { getPlanNameForProductId, polarProductIds } from "@/lib/polar-products";

export interface WebAuthUser {
  id: string;
  name: string;
  email: string;
}

export interface DeviceFlowState {
  userCode: string;
  verificationUri: string;
  verificationUriComplete?: string;
  deviceCode: string;
  expiresAt: number;
  interval: number;
}

export type Subscription = models.CustomerStateSubscription;
export type CustomerState = models.CustomerState;

export interface BillingUsageSummary {
  credited: number;
  consumed: number;
  remaining: number;
}

export function getBillingUsageSummary(
  customerState: CustomerState | null | undefined,
): BillingUsageSummary | null {
  const meters = customerState?.active_meters;
  if (!meters?.length) {
    return null;
  }

  const credited = meters.reduce((sum, meter) => sum + meter.credited_units, 0);
  const balance = meters.reduce((sum, meter) => sum + meter.balance, 0);

  // Grants are issued via negative event ingestion, which makes net consumed_units lower than actual usage.
  // Use the larger of credited or balance as the effective pool so grants don't produce negatives.
  const effectivePool = Math.max(credited, balance);
  const effectiveConsumed = Math.max(effectivePool - balance, 0);

  return {
    credited: effectivePool,
    consumed: effectiveConsumed,
    remaining: Math.max(balance, 0),
  };
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export function getActivePaidSubscription(
  customerState: CustomerState | null | undefined,
): Subscription | null {
  return (
    customerState?.active_subscriptions?.find(
      (subscription) =>
        ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status) &&
        subscription.product_id !== polarProductIds.free,
    ) ?? null
  );
}

export function getPlanNameForSubscription(subscription: Subscription | null | undefined): string {
  if (!subscription || subscription.product_id === polarProductIds.free) {
    return "Free";
  }

  return getPlanNameForProductId(subscription.product_id) ?? "Unknown Plan";
}

export function hasAgentOneCreditsAvailable(
  usageSummary: BillingUsageSummary | null | undefined,
): boolean {
  return Boolean(usageSummary && usageSummary.remaining > 0);
}

export function isAgentOneAccountProvisioning(
  usageSummary: BillingUsageSummary | null | undefined,
): boolean {
  return !usageSummary || usageSummary.credited <= 0;
}

export interface WebAuthContextType {
  user: WebAuthUser | null;
  isLoading: boolean;
  isSigningIn: boolean;
  isSigningOut: boolean;
  deviceFlow: DeviceFlowState | null;
  customerState: CustomerState | null;
  billingLoading: boolean;
  billingError: string | null;
  refreshBilling: () => void;
  startSignIn: () => Promise<void>;
  cancelSignIn: () => void;
  signOut: () => Promise<void>;
}

export const WebAuthContext = createContext<WebAuthContextType | undefined>(undefined);
