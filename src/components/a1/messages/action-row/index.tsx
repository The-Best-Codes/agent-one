import type { UIMessage } from "ai";
import { useAtom, useAtomValue } from "jotai";

import { CopyButton } from "@/components/a1/copy-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">Copy message</TooltipContent>
        </Tooltip>

        {messageRole === "assistant" && contentToSpeak.trim() ? (
          <TtsAction messageId={messageId} text={contentToSpeak} />
        ) : null}

        {onBranch && messageRole === "assistant" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <BranchButton onBranch={onBranch} className="size-6" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">Branch conversation</TooltipContent>
          </Tooltip>
        )}
        {messageRole === "assistant" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <RetryButton messageId={messageId} className="size-6" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">Regenerate response</TooltipContent>
          </Tooltip>
        )}
        {onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <EditButton onEdit={onEdit} className="size-6" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">Edit message</TooltipContent>
          </Tooltip>
        )}
      </>
    </div>
  );
};

function TtsAction({ messageId, text }: { messageId: string; text: string }) {
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
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <TtsButton messageId={messageId} text={text} className="size-6" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">Read aloud</TooltipContent>
    </Tooltip>
  );
}
