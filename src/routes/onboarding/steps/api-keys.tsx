import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ApiKeyConfig {
  provider: string;
  key: string;
  label: string;
}

interface ApiKeysStepProps {
  onSubmit: (keys: Record<string, string>) => void;
  initialKeys?: Record<string, string>;
}

const API_KEY_CONFIG: ApiKeyConfig[] = [
  {
    provider: "google",
    key: "GOOGLE_GENERATIVE_AI_API_KEY",
    label: "Google Generative AI",
  },
  { provider: "groq", key: "GROQ_API_KEY", label: "Groq" },
  { provider: "openrouter", key: "OPENROUTER_API_KEY", label: "OpenRouter" },
];

export function ApiKeysStep({ onSubmit, initialKeys = {} }: ApiKeysStepProps) {
  const [apiKeyInputs, setApiKeyInputs] =
    useState<Record<string, string>>(initialKeys);

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeyInputs((prev) => ({
      ...prev,
      [provider]: value,
    }));
  };

  const hasAtLeastOneKey =
    apiKeyInputs.google || apiKeyInputs.groq || apiKeyInputs.openrouter;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-md px-4 duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-2xl font-bold">
            Set up your API keys
          </h2>
          <p className="text-muted-foreground">
            Add at least one API key to get started. You can add more later in
            settings.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {API_KEY_CONFIG.map((config) => (
            <div key={config.provider} className="flex flex-col gap-2">
              <label className="text-foreground text-sm font-medium">
                {config.label}
              </label>
              <Input
                type="password"
                placeholder={`Paste your ${config.label} API key`}
                value={apiKeyInputs[config.provider] || ""}
                onChange={(e) =>
                  handleApiKeyChange(config.provider, e.target.value)
                }
              />
            </div>
          ))}
        </div>

        <Button
          onClick={() => onSubmit(apiKeyInputs)}
          disabled={!hasAtLeastOneKey}
          className="w-full"
        >
          Complete Setup
        </Button>
      </div>
    </div>
  );
}
