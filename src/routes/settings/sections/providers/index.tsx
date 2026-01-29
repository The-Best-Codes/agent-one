import { useAtom } from "jotai";

import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import {
  cerebrasApiKeyAtom,
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  opencodeApiKeyAtom,
  openrouterApiKeyAtom,
} from "@/lib/jotai/api-key-atoms";
import {
  cerebrasConfigAtom,
  googleConfigAtom,
  groqConfigAtom,
  opencodeConfigAtom,
  openrouterConfigAtom,
} from "@/lib/jotai/provider-atoms";
import type { ProviderId } from "@/lib/settings/types";

import { ProviderListItem } from "./provider-list-item";

interface ProviderDefinition {
  id: ProviderId;
  label: string;
  description?: string;
  envKey: string;
}

const PROVIDERS: ProviderDefinition[] = [
  {
    id: "cerebras",
    label: "Cerebras",
    description: "Fast inference provider for LLM models.",
    envKey: "AGENT_ONE_CEREBRAS_API_KEY",
  },
  {
    id: "google",
    label: "Google Generative AI",
    description: "Access Gemini and other Google AI models.",
    envKey: "AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY",
  },
  {
    id: "groq",
    label: "Groq",
    description: "Ultra-fast inference with Groq LPUs.",
    envKey: "AGENT_ONE_GROQ_API_KEY",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "Unified access to many AI models via a single API.",
    envKey: "AGENT_ONE_OPENROUTER_API_KEY",
  },
  {
    id: "opencode",
    label: "OpenCode",
    description: "OpenCode AI models and services.",
    envKey: "AGENT_ONE_OPENCODE_API_KEY",
  },
];

export default function ProvidersSection() {
  const { isApiKeysLoading } = useApiKeys();

  const [cerebrasKey, setCerebrasKey] = useAtom(cerebrasApiKeyAtom);
  const [googleKey, setGoogleKey] = useAtom(googleGenerativeAiApiKeyAtom);
  const [groqKey, setGroqKey] = useAtom(groqApiKeyAtom);
  const [openrouterKey, setOpenrouterKey] = useAtom(openrouterApiKeyAtom);
  const [opencodeKey, setOpencodeKey] = useAtom(opencodeApiKeyAtom);

  const [cerebrasConfig, setCerebrasConfig] = useAtom(cerebrasConfigAtom);
  const [googleConfig, setGoogleConfig] = useAtom(googleConfigAtom);
  const [groqConfig, setGroqConfig] = useAtom(groqConfigAtom);
  const [openrouterConfig, setOpenrouterConfig] = useAtom(openrouterConfigAtom);
  const [opencodeConfig, setOpencodeConfig] = useAtom(opencodeConfigAtom);

  const getProviderState = (providerId: ProviderId) => {
    switch (providerId) {
      case "cerebras":
        return {
          apiKey: cerebrasKey,
          setApiKey: setCerebrasKey,
          config: cerebrasConfig,
          setConfig: setCerebrasConfig,
          hasEnvKey: Boolean(import.meta.env.AGENT_ONE_CEREBRAS_API_KEY),
        };
      case "google":
        return {
          apiKey: googleKey,
          setApiKey: setGoogleKey,
          config: googleConfig,
          setConfig: setGoogleConfig,
          hasEnvKey: Boolean(
            import.meta.env.AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY,
          ),
        };
      case "groq":
        return {
          apiKey: groqKey,
          setApiKey: setGroqKey,
          config: groqConfig,
          setConfig: setGroqConfig,
          hasEnvKey: Boolean(import.meta.env.AGENT_ONE_GROQ_API_KEY),
        };
      case "openrouter":
        return {
          apiKey: openrouterKey,
          setApiKey: setOpenrouterKey,
          config: openrouterConfig,
          setConfig: setOpenrouterConfig,
          hasEnvKey: Boolean(import.meta.env.AGENT_ONE_OPENROUTER_API_KEY),
        };
      case "opencode":
        return {
          apiKey: opencodeKey,
          setApiKey: setOpencodeKey,
          config: opencodeConfig,
          setConfig: setOpencodeConfig,
          hasEnvKey: Boolean(import.meta.env.AGENT_ONE_OPENCODE_API_KEY),
        };
    }
  };

  if (isApiKeysLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Providers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Providers</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Configure AI providers and their API keys. Enable or disable providers
          to control which models appear in the model selector.
        </p>

        <ScrollArea className="max-h-96">
          <Accordion
            type="single"
            collapsible
            className="border-border w-full rounded-md border"
          >
            {PROVIDERS.map((provider) => {
              const state = getProviderState(provider.id);
              return (
                <ProviderListItem
                  key={provider.id}
                  providerId={provider.id}
                  label={provider.label}
                  description={provider.description}
                  config={state.config}
                  apiKey={state.apiKey}
                  hasEnvKey={state.hasEnvKey}
                  onConfigChange={(updates) =>
                    state.setConfig((prev) => ({ ...prev, ...updates }))
                  }
                  onApiKeyChange={state.setApiKey}
                />
              );
            })}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
