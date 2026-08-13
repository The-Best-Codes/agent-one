import { createContext } from "react";

import { getPlanNameForProductId } from "@/lib/polar-products";

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

export interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd?: string | Date;
  productId: string;
}

export interface CustomerMeter {
  id: string;
  meterId: string;
  consumedUnits: number;
  creditedUnits: number;
  balance: number;
}

export interface CustomerState {
  activeSubscriptions?: Subscription[];
  activeMeters?: CustomerMeter[];
}

export interface BillingUsageSummary {
  credited: number;
  consumed: number;
  remaining: number;
}

export function getBillingUsageSummary(
  customerState: CustomerState | null | undefined,
): BillingUsageSummary | null {
  const meters = customerState?.activeMeters;
  if (!meters?.length) {
    return null;
  }

  const credited = meters.reduce((sum, meter) => sum + meter.creditedUnits, 0);
  const balance = meters.reduce((sum, meter) => sum + meter.balance, 0);

  // Grants are issued via negative event ingestion, which makes net consumedUnits lower than actual usage.
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
    customerState?.activeSubscriptions?.find(
      (subscription) =>
        ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status) &&
        getPlanNameForProductId(subscription.productId) !== "Free",
    ) ?? null
  );
}

export function getPlanNameForSubscription(subscription: Subscription | null | undefined): string {
  if (!subscription) {
    return "Free";
  }

  return getPlanNameForProductId(subscription.productId) ?? "Unknown Plan";
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
