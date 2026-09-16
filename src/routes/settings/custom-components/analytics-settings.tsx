import { useAtom } from "jotai";

import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Switch } from "@/components/ui/switch";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { analyticsIdentityAtom } from "@/lib/jotai/settings-atoms";

export function AnalyticsEnabledControl() {
  const [analyticsIdentity, setAnalyticsIdentity] = useAtom(analyticsIdentityAtom);

  return (
    <Switch
      checked={analyticsIdentity !== "off"}
      onCheckedChange={(checked) => {
        const nextValue = checked ? "user-id" : "off";
        trackSettingsInteraction("analytics", "allow_usage_analytics_changed", {
          value: nextValue,
        });
        setAnalyticsIdentity(nextValue);
      }}
      aria-label="Allow usage analytics"
    />
  );
}

export function AnalyticsIdentityControl() {
  const [analyticsIdentity, setAnalyticsIdentity] = useAtom(analyticsIdentityAtom);
  const { user } = useWebAuth();

  return (
    <AdaptiveTooltip>
      <AdaptiveTooltipTrigger asChild>
        <span>
          <Switch
            checked={analyticsIdentity === "user-id"}
            disabled={analyticsIdentity === "off" || !user}
            onCheckedChange={(checked) => {
              trackSettingsInteraction("analytics", "analytics_identity_changed", {
                value: checked ? "user-id" : "anonymous",
                signed_in: Boolean(user),
              });
              setAnalyticsIdentity(checked ? "user-id" : "anonymous");
            }}
            aria-label="Associate analytics with my signed-in account"
          />
        </span>
      </AdaptiveTooltipTrigger>
      {!user && (
        <AdaptiveTooltipContent>
          You're not signed in, so analytics aren't associated with your account.
        </AdaptiveTooltipContent>
      )}
    </AdaptiveTooltip>
  );
}
