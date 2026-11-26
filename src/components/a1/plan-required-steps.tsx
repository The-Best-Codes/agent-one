import { IconRocket } from "@tabler/icons-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { AGENT_ONE_UPGRADE_URL } from "@/lib/constants";

export const PlanCheckingStep = ({ title }: { title: string }) => (
  <>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>Checking your account…</DialogDescription>
    </DialogHeader>
    <div className="flex justify-center py-6">
      <Spinner />
    </div>
  </>
);

export const UpgradeRequiredStep = ({
  title,
  description,
  onCancel,
}: {
  title: string;
  description: string;
  onCancel: () => void;
}) => {
  const { refreshBilling } = useWebAuth();

  useEffect(() => {
    window.addEventListener("focus", refreshBilling);
    return () => window.removeEventListener("focus", refreshBilling);
  }, [refreshBilling]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button asChild>
          <a href={AGENT_ONE_UPGRADE_URL} target="_blank" rel="noopener noreferrer">
            <IconRocket data-icon="inline-start" />
            Upgrade
          </a>
        </Button>
      </DialogFooter>
    </>
  );
};
