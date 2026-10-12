import { type AnthropicLanguageModelOptions, createAnthropic } from "@ai-sdk/anthropic";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { defaultSettingsMiddleware, wrapLanguageModel } from "ai";

const BLOCK_BINDING_MODEL_PREFIXES = [
  "claude-fable-5-1",
  "claude-opus-5-5",
  "claude-sonnet-5-5",
  "claude-haiku-5-5",
];

function supportsBlockBinding(modelId: string) {
  return BLOCK_BINDING_MODEL_PREFIXES.some((prefix) => modelId.startsWith(prefix));
}

export function getAnthropic(apiKey: string, headers?: Record<string, string>) {
  const provider = createAnthropic({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers: {
      "anthropic-dangerous-direct-browser-access": "true",
      ...headers,
    },
  });

  return {
    languageModel: (modelId: string) => {
      const model = provider.languageModel(modelId);

      if (!supportsBlockBinding(modelId)) {
        return model;
      }

      return wrapLanguageModel({
        model,
        middleware: defaultSettingsMiddleware({
          settings: {
            providerOptions: {
              anthropic: {
                thinking: {
                  type: "adaptive",
                  blockBinding: { prefixMismatchBehavior: "drop_block" },
                },
              } satisfies AnthropicLanguageModelOptions,
            },
          },
        }),
      });
    },
  };
}
