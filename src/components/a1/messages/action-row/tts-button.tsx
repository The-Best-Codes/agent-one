import { IconPlayerStopFilled, IconVolume, IconVolumeOff } from "@tabler/icons-react";
import { useAtom, useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { generateTtsAudio, normalizeTtsSettings } from "@/lib/ai/tts";
import { apiKeyAtomFamily } from "@/lib/jotai/api-key-atoms";
import { ttsSettingsAtom } from "@/lib/jotai/settings-atoms";
import { ttsPlaybackControllerAtom, ttsPlaybackStateAtom } from "@/lib/jotai/tts-atoms";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const logger = getLogger(import.meta.url);

export function TtsButton({
  messageId,
  text,
  className,
}: {
  messageId: string;
  text: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const [ttsState, setTtsState] = useAtom(ttsPlaybackStateAtom);
  const [controller, setController] = useAtom(ttsPlaybackControllerAtom);
  const rawTtsSettings = useAtomValue(ttsSettingsAtom);
  const apiKeys = {
    openai: useAtomValue(apiKeyAtomFamily("tts-openai")),
    elevenlabs: useAtomValue(apiKeyAtomFamily("tts-elevenlabs")),
    lmnt: useAtomValue(apiKeyAtomFamily("tts-lmnt")),
    hume: useAtomValue(apiKeyAtomFamily("tts-hume")),
    google: useAtomValue(apiKeyAtomFamily("tts-google")),
  };
  const ttsSettings = normalizeTtsSettings(rawTtsSettings);
  const isCurrentMessage = ttsState.messageId === messageId;
  const isDisabled = isCurrentMessage && ["loading", "error"].includes(ttsState.status);

  const stopPlayback = () => {
    controller?.stop();
    setController(null);
    setTtsState({ status: "idle", messageId: null });
  };

  const handleClick = async () => {
    if (isCurrentMessage && ttsState.status === "playing") {
      stopPlayback();
      return;
    }

    if (!text.trim()) {
      return;
    }

    stopPlayback();

    const abortController = new AbortController();
    const audio = new Audio();
    let objectUrl: string | null = null;

    const cleanup = () => {
      audio.pause();
      audio.src = "";
      audio.onended = null;
      audio.onerror = null;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    setController({
      stop: () => {
        abortController.abort();
        cleanup();
      },
    });
    setTtsState({ status: "loading", messageId });

    try {
      const { uint8Array, mediaType } = await generateTtsAudio(
        text,
        ttsSettings,
        {
          openai: apiKeys.openai,
          elevenlabs: apiKeys.elevenlabs,
          lmnt: apiKeys.lmnt,
          hume: apiKeys.hume,
          google: apiKeys.google,
        },
        abortController.signal,
      );

      if (abortController.signal.aborted) {
        cleanup();
        setController(null);
        setTtsState({ status: "idle", messageId: null });
        return;
      }

      objectUrl = URL.createObjectURL(new Blob([new Uint8Array(uint8Array)], { type: mediaType }));
      audio.src = objectUrl;
      audio.onended = () => {
        cleanup();
        setController(null);
        setTtsState({ status: "idle", messageId: null });
      };
      audio.onerror = () => {
        cleanup();
        setController(null);
        setTtsState({ status: "error", messageId });
        window.setTimeout(() => setTtsState({ status: "idle", messageId: null }), 1500);
      };

      await audio.play();
      setTtsState({ status: "playing", messageId });
    } catch (error) {
      cleanup();
      setController(null);

      if (abortController.signal.aborted) {
        setTtsState({ status: "idle", messageId: null });
        return;
      }

      logger.error("Error generating speech:", error);
      setTtsState({ status: "error", messageId });
      window.setTimeout(() => setTtsState({ status: "idle", messageId: null }), 1500);
    }
  };

  const icon = isCurrentMessage ? ttsState.status : "idle";

  return (
    <Button
      onClick={() => void handleClick()}
      disabled={isDisabled}
      className={cn("size-8", className)}
      size="icon-sm"
      variant="secondary"
      aria-label={icon === "playing" ? t("messages.stopReadingAloud") : t("messages.readAloud")}
    >
      {icon === "loading" ? (
        <Spinner />
      ) : icon === "error" ? (
        <IconVolumeOff />
      ) : icon === "playing" ? (
        <IconPlayerStopFilled />
      ) : (
        <IconVolume />
      )}
    </Button>
  );
}
