import { IconPlayerPlay } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useChatFunctions, useChatMessages, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";

export const MainInputIncompleteSection = ({ onRetry }: { onRetry?: () => void }) => {
  const { t } = useTranslation();
  const { error, status } = useChatStatus();
  const { resumeStream } = useChatFunctions();
  const messages = useChatMessages();
  const { hasAvailableModels } = useModelCatalog();

  if (error || status === "streaming" || status === "submitted") {
    return null;
  }

  if (messages.length === 0) {
    return null;
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    return null;
  }

  return (
    <div className="bg-muted/50 border-muted-foreground/20 text-foreground mb-0 flex w-full flex-row items-center justify-between gap-2 rounded-none border p-2 md:mb-2 md:rounded-md">
      <div className="flex max-h-24 w-full flex-col items-start overflow-auto">
        <h3 className="text-lg font-bold">{t("chat.incomplete")}</h3>
        <span className="text-base">{t("chat.incompleteDescription")}</span>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Button
          onClick={() => {
            void resumeStream();
            onRetry?.();
          }}
          variant="default"
          disabled={!hasAvailableModels}
        >
          <IconPlayerPlay data-icon="inline-start" />
          {t("chat.resume")}
        </Button>
      </div>
    </div>
  );
};
