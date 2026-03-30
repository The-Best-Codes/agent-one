import { createContext } from "react";

export interface WebAuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
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

export interface WebAuthContextType {
  user: WebAuthUser | null;
  isLoading: boolean;
  isSigningIn: boolean;
  isSigningOut: boolean;
  deviceFlow: DeviceFlowState | null;
  customerState: CustomerState | null;
  billingLoading: boolean;
  billingError: string | null;
  startSignIn: () => Promise<void>;
  cancelSignIn: () => void;
  signOut: () => Promise<void>;
}

export const WebAuthContext = createContext<WebAuthContextType | undefined>(undefined);
