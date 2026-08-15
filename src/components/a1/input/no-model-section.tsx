import { IconKey } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import {
  getBillingUsageSummary,
  isAgentOneAccountProvisioning,
} from "@/contexts/use-web-auth/web-auth-contexts";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";

export const MainInputNoModelSection = () => {
  const { t } = useTranslation();
  const { hasAvailableModels } = useModelCatalog();
  const { isApiKeysLoading } = useApiKeys();
  const { user, isLoading, customerState, billingLoading, billingError } = useWebAuth();
  const { chatId } = useParams();
  const usageSummary = getBillingUsageSummary(customerState);
  const isProvisioning =
    Boolean(user) &&
    !billingLoading &&
    !billingError &&
    isAgentOneAccountProvisioning(usageSummary);

  if (isApiKeysLoading || isLoading || hasAvailableModels || billingLoading || isProvisioning) {
    return null;
  }

  const settingsPath = chatId
    ? `/settings?tab=providers&chatId=${chatId}#setting-built-in-providers`
    : "/settings?tab=providers#setting-built-in-providers";

  return (
    <div className="bg-muted/50 border-muted-foreground/20 text-foreground mb-0 flex w-full flex-row items-center justify-between gap-2 rounded-none border p-2 md:mb-2 md:rounded-md">
      <div className="flex max-h-24 w-full flex-col items-start overflow-auto">
        <span className="text-lg font-bold">{t("chat.noModelsAvailable")}</span>
        <span className="text-base">
          <Link to="/settings?tab=account#setting-hide-agentone-models" className="underline">
            {t("chat.noModelsDescriptionLink")}
          </Link>{" "}
          {t("chat.noModelsDescriptionAfter")}
        </span>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Button asChild variant="default">
          <Link to={settingsPath} data-icon="inline-start">
            <IconKey data-icon="inline-start" />
            {t("common.settings")}
          </Link>
        </Button>
      </div>
    </div>
  );
};
