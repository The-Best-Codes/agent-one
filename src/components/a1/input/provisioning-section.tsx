import { IconInfoCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getBillingUsageSummary,
  isAgentOneAccountProvisioning,
} from "@/contexts/use-web-auth/web-auth-contexts";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";

export const MainInputProvisioningSection = () => {
  const { t } = useTranslation();
  const { user, customerState, billingLoading, billingError } = useWebAuth();
  const usageSummary = getBillingUsageSummary(customerState);
  const showProvisioningAlert =
    Boolean(user) &&
    customerState !== null &&
    !billingLoading &&
    !billingError &&
    isAgentOneAccountProvisioning(usageSummary);

  if (!showProvisioningAlert) {
    return null;
  }

  return (
    <Alert className="mb-0 rounded-none md:mb-2 md:rounded-md">
      <IconInfoCircle />
      <AlertTitle>{t("chat.provisioningTitle")}</AlertTitle>
      <AlertDescription>{t("chat.provisioningDescription")}</AlertDescription>
    </Alert>
  );
};
