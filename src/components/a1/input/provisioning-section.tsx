import { IconInfoCircle } from "@tabler/icons-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getBillingUsageSummary,
  isAgentOneAccountProvisioning,
} from "@/contexts/use-web-auth/web-auth-contexts";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";

export const MainInputProvisioningSection = () => {
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
      <AlertTitle>Account setup in progress</AlertTitle>
      <AlertDescription>
        Your account will be ready in a few minutes. AgentOne chat will start working once your
        credits appear.
      </AlertDescription>
    </Alert>
  );
};
