import { createElevenLabs, type ElevenLabsSpeechModelOptions } from "@ai-sdk/elevenlabs";
import { createGoogle } from "@ai-sdk/google";
import { createHume, type HumeSpeechModelOptions } from "@ai-sdk/hume";
import { createLMNT, type LMNTSpeechModelOptions } from "@ai-sdk/lmnt";
import { createOpenAI, type OpenAISpeechModelOptions } from "@ai-sdk/openai";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { generateSpeech } from "ai";

import type { TtsProviderId, TtsSettings } from "@/lib/settings/types";

type LegacyTtsSettings = Partial<TtsSettings> & {
  model?: string;
};

export const TTS_PROVIDER_OPTIONS = [
  {
    id: "openai",
    label: "OpenAI",
    models: ["tts-1", "tts-1-hd", "gpt-4o-mini-tts"],
    voices: [
      "alloy",
      "ash",
      "ballad",
      "coral",
      "echo",
      "fable",
      "nova",
      "onyx",
      "sage",
      "shimmer",
      "verse",
      "marin",
      "cedar",
    ],
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    models: [
      "eleven_v3",
      "eleven_multilingual_v2",
      "eleven_flash_v2_5",
      "eleven_flash_v2",
      "eleven_turbo_v2_5",
      "eleven_turbo_v2",
    ],
    voices: [],
  },
  {
    id: "lmnt",
    label: "LMNT",
    models: ["aurora", "blizzard"],
    voices: [],
  },
  {
    id: "hume",
    label: "Hume",
    models: ["default"],
    voices: [],
  },
  {
    id: "google",
    label: "Google Gemini",
    models: [
      "gemini-2.5-flash-tts",
      "gemini-2.5-pro-tts",
      "gemini-2.5-flash-lite-preview-tts",
      "gemini-3.1-flash-tts-preview",
    ],
    voices: [
      "Achernar",
      "Achird",
      "Algenib",
      "Algieba",
      "Alnilam",
      "Aoede",
      "Autonoe",
      "Callirrhoe",
      "Charon",
      "Despina",
      "Enceladus",
      "Erinome",
      "Fenrir",
      "Gacrux",
      "Iapetus",
      "Kore",
      "Laomedeia",
      "Leda",
      "Orus",
      "Puck",
      "Pulcherrima",
      "Rasalgethi",
      "Sadachbia",
      "Sadaltager",
      "Schedar",
      "Sulafat",
      "Umbriel",
      "Vindemiatrix",
      "Zephyr",
      "Zubenelgenubi",
    ],
  },
] as const satisfies ReadonlyArray<{
  id: TtsProviderId;
  label: string;
  models: readonly string[];
  voices: readonly string[];
}>;

export function getDefaultTtsModel(provider: TtsProviderId): string {
  return TTS_PROVIDER_OPTIONS.find((option) => option.id === provider)?.models[0] ?? "";
}

export function getSelectedTtsModel(settings: TtsSettings): string {
  switch (settings.provider) {
    case "openai":
      return settings.openai.model;
    case "elevenlabs":
      return settings.elevenlabs.model;
    case "lmnt":
      return settings.lmnt.model;
    case "hume":
      return settings.hume.model;
    case "google":
      return settings.google.model;
    default:
      return "";
  }
}

export function normalizeTtsSettings(settings: LegacyTtsSettings | undefined): TtsSettings {
  const provider =
    settings?.provider && TTS_PROVIDER_OPTIONS.some((option) => option.id === settings.provider)
      ? settings.provider
      : "";

  return {
    provider,
    openai: {
      model:
        settings?.openai?.model?.trim() || settings?.model?.trim() || getDefaultTtsModel("openai"),
      voice: settings?.openai?.voice?.trim() || "alloy",
      speed: settings?.openai?.speed ?? 1,
      instructions: settings?.openai?.instructions ?? "",
    },
    elevenlabs: {
      model:
        settings?.elevenlabs?.model?.trim() ||
        settings?.model?.trim() ||
        getDefaultTtsModel("elevenlabs"),
      voice: settings?.elevenlabs?.voice?.trim() || "21m00Tcm4TlvDq8ikWAM",
      speed: settings?.elevenlabs?.speed ?? 1,
      languageCode: settings?.elevenlabs?.languageCode?.trim() || "",
      stability: settings?.elevenlabs?.stability ?? 0.5,
      similarityBoost: settings?.elevenlabs?.similarityBoost ?? 0.75,
      style: settings?.elevenlabs?.style ?? 0,
      useSpeakerBoost: settings?.elevenlabs?.useSpeakerBoost ?? false,
      applyTextNormalization: settings?.elevenlabs?.applyTextNormalization ?? "auto",
    },
    lmnt: {
      model: settings?.lmnt?.model?.trim() || settings?.model?.trim() || getDefaultTtsModel("lmnt"),
      voice: settings?.lmnt?.voice?.trim() || "ava",
      language: settings?.lmnt?.language?.trim() || "en",
      speed: settings?.lmnt?.speed ?? 1,
      conversational: settings?.lmnt?.conversational ?? false,
    },
    hume: {
      model: settings?.hume?.model?.trim() || settings?.model?.trim() || getDefaultTtsModel("hume"),
      voice: settings?.hume?.voice?.trim() || "d8ab67c6-953d-4bd8-9370-8fa53a0f1453",
      speed: settings?.hume?.speed ?? 1,
      instructions: settings?.hume?.instructions ?? "",
    },
    google: {
      model:
        settings?.google?.model?.trim() || settings?.model?.trim() || getDefaultTtsModel("google"),
      voice: settings?.google?.voice?.trim() || "Kore",
      speed: settings?.google?.speed ?? 1,
      instructions: settings?.google?.instructions ?? "",
    },
  };
}

export function hasConfiguredTts(settings: TtsSettings): boolean {
  return settings.provider !== "" && getSelectedTtsModel(settings).trim() !== "";
}

export function isTtsProviderConfigured(
  settingsInput: TtsSettings,
  apiKeys: Partial<Record<TtsProviderId, string>>,
): boolean {
  const settings = normalizeTtsSettings(settingsInput);

  if (!hasConfiguredTts(settings)) {
    return false;
  }

  if (!settings.provider) {
    return false;
  }

  return Boolean(apiKeys[settings.provider]?.trim());
}

type TtsApiKeys = Record<TtsProviderId, string>;

export async function generateTtsAudio(
  text: string,
  settingsInput: TtsSettings,
  apiKeys: TtsApiKeys,
  abortSignal?: AbortSignal,
): Promise<{ uint8Array: Uint8Array; mediaType: string }> {
  const settings = normalizeTtsSettings(settingsInput);
  const model = getSelectedTtsModel(settings);

  switch (settings.provider) {
    case "openai": {
      const provider = createOpenAI({
        apiKey: apiKeys.openai || "unset",
        fetch: tauriFetch,
      });

      const result = await generateSpeech({
        model: provider.speech(model),
        text,
        voice: settings.openai.voice,
        speed: settings.openai.speed,
        instructions: settings.openai.instructions || undefined,
        providerOptions: {
          openai: {
            speed: settings.openai.speed,
            instructions: settings.openai.instructions || undefined,
          } satisfies OpenAISpeechModelOptions,
        },
        abortSignal,
      });

      return {
        uint8Array: result.audio.uint8Array,
        mediaType: result.audio.mediaType,
      };
    }

    case "elevenlabs": {
      const provider = createElevenLabs({
        apiKey: apiKeys.elevenlabs || "unset",
        fetch: tauriFetch,
      });

      const result = await generateSpeech({
        model: provider.speech(model),
        text,
        voice: settings.elevenlabs.voice,
        speed: settings.elevenlabs.speed,
        providerOptions: {
          elevenlabs: {
            languageCode: settings.elevenlabs.languageCode || undefined,
            voiceSettings: {
              stability: settings.elevenlabs.stability,
              similarityBoost: settings.elevenlabs.similarityBoost,
              style: settings.elevenlabs.style,
              useSpeakerBoost: settings.elevenlabs.useSpeakerBoost,
            },
            applyTextNormalization: settings.elevenlabs.applyTextNormalization,
          } satisfies ElevenLabsSpeechModelOptions,
        },
        abortSignal,
      });

      return {
        uint8Array: result.audio.uint8Array,
        mediaType: result.audio.mediaType,
      };
    }

    case "lmnt": {
      const provider = createLMNT({
        apiKey: apiKeys.lmnt || "unset",
        fetch: tauriFetch,
      });

      const result = await generateSpeech({
        model: provider.speech(model),
        text,
        voice: settings.lmnt.voice,
        language: settings.lmnt.language,
        speed: settings.lmnt.speed,
        providerOptions: {
          lmnt: {
            model,
            format: "mp3",
            sampleRate: 24000,
            speed: settings.lmnt.speed,
            conversational: settings.lmnt.conversational,
            topP: 1,
            temperature: 1,
          } satisfies LMNTSpeechModelOptions,
        },
        abortSignal,
      });

      return {
        uint8Array: result.audio.uint8Array,
        mediaType: result.audio.mediaType,
      };
    }

    case "hume": {
      const provider = createHume({
        apiKey: apiKeys.hume || "unset",
        fetch: tauriFetch,
      });

      const result = await generateSpeech({
        model: provider.speech(),
        text,
        voice: settings.hume.voice,
        speed: settings.hume.speed,
        instructions: settings.hume.instructions || undefined,
        providerOptions: {
          hume: {} satisfies HumeSpeechModelOptions,
        },
        abortSignal,
      });

      return {
        uint8Array: result.audio.uint8Array,
        mediaType: result.audio.mediaType,
      };
    }

    case "google": {
      const provider = createGoogle({
        apiKey: apiKeys.google || "unset",
        fetch: tauriFetch,
      });

      const result = await generateSpeech({
        model: provider.speech(model),
        text,
        voice: settings.google.voice,
        speed: undefined,
        instructions: settings.google.instructions || undefined,
        abortSignal,
      });

      return {
        uint8Array: result.audio.uint8Array,
        mediaType: result.audio.mediaType,
      };
    }

    default:
      throw new Error("No text to speech provider selected.");
  }
}
