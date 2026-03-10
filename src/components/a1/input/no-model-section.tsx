import { KeyIcon } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";

export const MainInputNoModelSection = () => {
  const { hasAvailableModels } = useModelCatalog();
  const { isApiKeysLoading } = useApiKeys();
  const { chatId } = useParams();

  if (isApiKeysLoading || hasAvailableModels) {
    return null;
  }

  const settingsPath = chatId
    ? `/settings?tab=providers&chatId=${chatId}`
    : "/settings?tab=providers";

  return (
    <div className="bg-muted/50 border-muted-foreground/20 text-foreground mb-0 flex w-full flex-row items-center justify-between gap-2 rounded-none border p-2 md:mb-2 md:rounded-md">
      <div className="flex max-h-24 w-full flex-col items-start overflow-auto">
        <span className="text-lg font-bold">No Models Available</span>
        <span className="text-base">Configure a provider in settings to start chatting.</span>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Button asChild variant="default">
          <Link to={settingsPath} data-icon="inline-start">
            <KeyIcon data-icon="inline-start" />
            Settings
          </Link>
        </Button>
      </div>
    </div>
  );
};
