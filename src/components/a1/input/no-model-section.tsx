import { KeyIcon } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";

export const MainInputNoModelSection = () => {
  const { hasAvailableModels } = useModelCatalog();
  const { chatId } = useParams();

  if (hasAvailableModels) {
    return null;
  }

  const settingsPath = chatId
    ? `/settings?tab=account&chatId=${chatId}`
    : "/settings?tab=account";

  return (
    <div className="bg-muted/50 border-muted-foreground/20 text-foreground mb-0 flex w-full flex-row items-center justify-between gap-2 rounded-none border p-2 md:mb-2 md:rounded-md">
      <div className="flex max-h-24 w-full flex-col items-start overflow-auto">
        <h3 className="text-lg font-bold">No Models Available</h3>
        <span className="text-base">
          Configure an API key in settings to start chatting.
        </span>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Button asChild variant="default">
          <Link to={settingsPath}>
            <KeyIcon />
            Settings
          </Link>
        </Button>
      </div>
    </div>
  );
};
