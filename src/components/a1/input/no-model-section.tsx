import { IconKey } from "@tabler/icons-react";

import { SettingsLink } from "@/components/a1/settings-link";
import { Button } from "@/components/ui/button";
import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import {
  getBillingUsageSummary,
  isAgentOneAccountProvisioning,
} from "@/contexts/use-web-auth/web-auth-contexts";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";

export const MainInputNoModelSection = () => {
  const { hasAvailableModels } = useModelCatalog();
  const { isApiKeysLoading } = useApiKeys();
  const { user, isLoading, customerState, billingLoading, billingError } = useWebAuth();
  const usageSummary = getBillingUsageSummary(customerState);
  const isProvisioning =
    Boolean(user) &&
    !billingLoading &&
    !billingError &&
    isAgentOneAccountProvisioning(usageSummary);

  if (isApiKeysLoading || isLoading || hasAvailableModels || billingLoading || isProvisioning) {
    return null;
  }

  return (
    <div className="bg-muted/50 border-muted-foreground/20 text-foreground mb-0 flex w-full flex-row items-center justify-between gap-2 rounded-none border p-2 md:mb-2 md:rounded-md">
      <div className="flex max-h-24 w-full flex-col items-start overflow-auto">
        <span className="text-lg font-bold">No Models Available</span>
        <span className="text-base">
          <SettingsLink tab="account" id="setting-hide-agentone-models" className="underline">
            Sign in and ensure "Hide AgentOne models" is disabled,
          </SettingsLink>{" "}
          or configure a provider in settings to start chatting.
        </span>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Button asChild variant="default">
          <SettingsLink tab="providers" id="setting-built-in-providers" data-icon="inline-start">
            <IconKey data-icon="inline-start" />
            Settings
          </SettingsLink>
        </Button>
      </div>
    </div>
  );
};
