import type { UIMessage } from "ai";
import { useAtom, useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { CopyButton } from "@/components/a1/copy-button";
import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { isTtsProviderConfigured, normalizeTtsSettings } from "@/lib/ai/tts";
import { apiKeyAtomFamily } from "@/lib/jotai/api-key-atoms";
import { showMessageActionRowAtom } from "@/lib/jotai/settings-atoms";
import { ttsSettingsAtom } from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

import { BranchButton } from "./branch-button";
import { EditButton } from "./edit-button";
import { RetryButton } from "./retry-button";
import { TtsButton } from "./tts-button";

export const MessageActionRow = ({
  contentToCopy,
  contentToSpeak,
  messageRole,
  messageId,
  onEdit,
  onBranch,
}: {
  contentToCopy: string;
  contentToSpeak: string;
  messageRole: UIMessage["role"];
  messageId: UIMessage["id"];
  onEdit?: () => void;
  onBranch?: () => void;
}) => {
  const { t } = useTranslation();
  const [showMessageActionRow] = useAtom(showMessageActionRowAtom);

  return (
    <div
      className={cn(
        "ease mt-1 flex gap-1 transition-opacity duration-200",
        messageRole !== "user" && "ml-2",
        {
          "opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100":
            showMessageActionRow === "hover",
          "opacity-100": showMessageActionRow === "always",
          hidden: showMessageActionRow === "never",
        },
      )}
    >
      <>
        <AdaptiveTooltip>
          <AdaptiveTooltipTrigger asChild>
            <div>
              <CopyButton
                className="size-6"
                variants={{
                  idle: "secondary",
                  copying: "secondary",
                  success: "secondary",
                  error: "secondary",
                }}
                text={contentToCopy}
                size="icon-sm"
              />
            </div>
          </AdaptiveTooltipTrigger>
          <AdaptiveTooltipContent side="bottom">{t("messages.copyMessage")}</AdaptiveTooltipContent>
        </AdaptiveTooltip>

        {messageRole === "assistant" && contentToSpeak.trim() ? (
          <TtsAction messageId={messageId} text={contentToSpeak} />
        ) : null}

        {onBranch && messageRole === "assistant" && (
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <div>
                <BranchButton onBranch={onBranch} className="size-6" />
              </div>
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="bottom">
              {t("messages.branchConversation")}
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        )}
        {messageRole === "assistant" && (
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <div>
                <RetryButton messageId={messageId} className="size-6" />
              </div>
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="bottom">{t("messages.regenerate")}</AdaptiveTooltipContent>
          </AdaptiveTooltip>
        )}
        {onEdit && (
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <div>
                <EditButton onEdit={onEdit} className="size-6" />
              </div>
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="bottom">{t("messages.editMessage")}</AdaptiveTooltipContent>
          </AdaptiveTooltip>
        )}
      </>
    </div>
  );
};

function TtsAction({ messageId, text }: { messageId: string; text: string }) {
  const { t } = useTranslation();
  const rawTtsSettings = useAtomValue(ttsSettingsAtom);
  const ttsSettings = normalizeTtsSettings(rawTtsSettings);
  const apiKeys = {
    openai: useAtomValue(apiKeyAtomFamily("tts-openai")),
    elevenlabs: useAtomValue(apiKeyAtomFamily("tts-elevenlabs")),
    lmnt: useAtomValue(apiKeyAtomFamily("tts-lmnt")),
    hume: useAtomValue(apiKeyAtomFamily("tts-hume")),
    google: useAtomValue(apiKeyAtomFamily("tts-google")),
  };

  if (!isTtsProviderConfigured(ttsSettings, apiKeys)) {
    return null;
  }

  return (
    <AdaptiveTooltip>
      <AdaptiveTooltipTrigger asChild>
        <div>
          <TtsButton messageId={messageId} text={text} className="size-6" />
        </div>
      </AdaptiveTooltipTrigger>
      <AdaptiveTooltipContent side="bottom">{t("messages.readAloud")}</AdaptiveTooltipContent>
    </AdaptiveTooltip>
  );
}
