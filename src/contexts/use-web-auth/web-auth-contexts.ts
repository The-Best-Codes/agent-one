import { createContext } from "react";

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
  currentPeriodEnd?: string;
  product?: {
    name?: string;
  };
}

export interface CustomerMeter {
  id: string;
  meterId: string;
  consumedUnits: number;
  creditedUnits: number;
  balance: number;
}

export interface CustomerState {
  subscriptions?: Subscription[];
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
