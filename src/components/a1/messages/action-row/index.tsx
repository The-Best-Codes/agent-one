import type { UIMessage } from "ai";
import { useAtom, useAtomValue } from "jotai";

import { CopyButton } from "@/components/a1/copy-button";
import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { isTtsProviderConfigured, normalizeTtsSettings } from "@/lib/ai/tts";
import { apiKeyAtomFamily } from "@/lib/jotai/api-key-atoms";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

import { BranchButton } from "./branch-button";
import { EditButton } from "./edit-button";
import { RetryButton } from "./retry-button";
import { TtsButton } from "./tts-button";

export const MessageActionRow = ({
  getContentToCopy,
  getContentToSpeak,
  hasContentToSpeak,
  messageRole,
  messageId,
  onEdit,
  onBranch,
}: {
  getContentToCopy: () => string;
  getContentToSpeak: () => string;
  hasContentToSpeak: boolean;
  messageRole: UIMessage["role"];
  messageId: UIMessage["id"];
  onEdit?: () => void;
  onBranch?: () => void;
}) => {
  const [showMessageActionRow] = useAtom(settingAtoms.SHOW_MESSAGE_ACTION_ROW);

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
                  idle: "outline",
                  copying: "outline",
                  success: "outline",
                  error: "outline",
                }}
                text={getContentToCopy}
                size="icon-sm"
              />
            </div>
          </AdaptiveTooltipTrigger>
          <AdaptiveTooltipContent side="bottom">Copy message</AdaptiveTooltipContent>
        </AdaptiveTooltip>

        {messageRole === "assistant" && hasContentToSpeak ? (
          <TtsAction messageId={messageId} getText={getContentToSpeak} />
        ) : null}

        {onBranch && messageRole === "assistant" && (
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <div>
                <BranchButton onBranch={onBranch} className="size-6" />
              </div>
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="bottom">Branch conversation</AdaptiveTooltipContent>
          </AdaptiveTooltip>
        )}
        {messageRole === "assistant" && (
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <div>
                <RetryButton messageId={messageId} className="size-6" />
              </div>
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="bottom">Regenerate response</AdaptiveTooltipContent>
          </AdaptiveTooltip>
        )}
        {onEdit && (
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <div>
                <EditButton onEdit={onEdit} className="size-6" />
              </div>
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="bottom">Edit message</AdaptiveTooltipContent>
          </AdaptiveTooltip>
        )}
      </>
    </div>
  );
};

function TtsAction({ messageId, getText }: { messageId: string; getText: () => string }) {
  const rawTtsSettings = useAtomValue(settingAtoms.TTS);
  const ttsSettings = normalizeTtsSettings(rawTtsSettings);
  const apiKeys = {
    openai: useAtomValue(apiKeyAtomFamily("tts-openai")),
    elevenlabs: useAtomValue(apiKeyAtomFamily("tts-elevenlabs")),
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
          <TtsButton messageId={messageId} getText={getText} className="size-6" />
        </div>
      </AdaptiveTooltipTrigger>
      <AdaptiveTooltipContent side="bottom">Read aloud</AdaptiveTooltipContent>
    </AdaptiveTooltip>
  );
}
