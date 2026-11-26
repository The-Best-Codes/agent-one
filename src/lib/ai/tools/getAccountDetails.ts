import { tool } from "ai";
import { z } from "zod";

import {
  getActivePaidSubscription,
  getBillingUsageSummary,
  getCreditsSubscription,
  getPlanNameForSubscription,
} from "@/contexts/use-web-auth/web-auth-contexts";
import { authClient, getAuthToken, SERVER_URL } from "@/lib/auth/auth-client";

const PRICING_URL = `${SERVER_URL}/pricing`;

export const createGetAccountDetailsTool = () =>
  tool({
    description: `Get the user's AgentOne account details: their plan, when it renews, and how many credits they've used and have left this period. Use this when the user asks about their plan, credits, or billing instead of guessing. What each plan includes and costs is on the pricing page (${PRICING_URL}).`,
    inputSchema: z.object({}),
    execute: async () => {
      if (!getAuthToken()) {
        return {
          signedIn: false,
          message:
            "The user isn't signed in to an AgentOne account. They can sign in from the account menu in the bottom left of the app sidebar.",
          pricingUrl: PRICING_URL,
        };
      }

      const { data, error } = await authClient.customer.state();
      if (error) {
        throw new Error(
          `Couldn't load the account details: ${error.message || error.statusText}. The user can see them in Settings > Account.`,
        );
      }

      const paidSubscription = getActivePaidSubscription(data);
      const credits = getBillingUsageSummary(data);
      return {
        signedIn: true,
        plan: getPlanNameForSubscription(paidSubscription),
        ...(paidSubscription && {
          renewsAt: paidSubscription.cancel_at_period_end
            ? null
            : paidSubscription.current_period_end,
          cancelsAt: paidSubscription.cancel_at_period_end
            ? paidSubscription.current_period_end
            : null,
        }),
        credits: credits && {
          ...credits,
          resetsAt: getCreditsSubscription(data)?.current_period_end ?? null,
        },
        pricingUrl: PRICING_URL,
      };
    },
  });
