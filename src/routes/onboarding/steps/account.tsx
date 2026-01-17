import {
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  LogInIcon,
  SearchIcon,
  UserPlusIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ApiKeyConfig {
  provider: string;
  key: string;
  label: string;
  description?: string;
}

interface AccountStepProps {
  onSubmit: (keys: Record<string, string>) => void;
  initialKeys?: Record<string, string>;
}

const API_KEY_CONFIG: ApiKeyConfig[] = [
  {
    provider: "openrouter",
    key: "OPENROUTER_API_KEY",
    label: "OpenRouter",
  },
  {
    provider: "google",
    key: "GOOGLE_GENERATIVE_AI_API_KEY",
    label: "Google",
  },
  {
    provider: "groq",
    key: "GROQ_API_KEY",
    label: "Groq",
  },
  {
    provider: "cerebras",
    key: "CEREBRAS_API_KEY",
    label: "Cerebras",
  },
  {
    provider: "opencode",
    key: "OPENCODE_API_KEY",
    label: "OpenCode",
  },
];

export function AccountStep({ onSubmit, initialKeys = {} }: AccountStepProps) {
  const [view, setView] = useState<"account" | "byok">("account");
  const [isExiting, setIsExiting] = useState(false);
  const [apiKeyInputs, setApiKeyInputs] =
    useState<Record<string, string>>(initialKeys);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const handleViewChange = (newView: "account" | "byok") => {
    setIsExiting(true);
    setTimeout(() => {
      setView(newView);
      setIsExiting(false);
    }, 500);
  };

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeyInputs((prev) => ({
      ...prev,
      [provider]: value,
    }));
  };

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const hasAtLeastOneKey = Object.values(apiKeyInputs).some(
    (val) => val.trim().length > 0,
  );

  const filteredProviders = API_KEY_CONFIG.filter((p) =>
    p.label.toLowerCase().includes(search.toLowerCase()),
  );

  if (view === "byok") {
    return (
      <div
        key="byok"
        className={cn(
          "w-full max-w-xl px-4 duration-500",
          isExiting
            ? "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards"
            : "animate-in slide-in-from-bottom-5 fade-in-0",
        )}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-foreground text-2xl font-bold">
              Bring your own keys
            </h2>
            <p className="text-muted-foreground text-sm">
              Your keys are stored securely on your device and never leave it.
            </p>
          </div>

          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search providers..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid max-h-[50svh] grid-cols-1 gap-3 overflow-y-auto pr-2 md:grid-cols-2">
            {filteredProviders.map((config) => {
              return (
                <div
                  key={config.provider}
                  className={cn("flex flex-col gap-3 rounded-md border p-4")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{config.label}</span>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      type={showKeys[config.provider] ? "text" : "password"}
                      autoSave="false"
                      placeholder="API Key"
                      className="h-8 pr-8 text-xs"
                      value={apiKeyInputs[config.provider] || ""}
                      onChange={(e) =>
                        handleApiKeyChange(config.provider, e.target.value)
                      }
                    />
                    <Button
                      title={
                        showKeys[config.provider] ? "Hide Key" : "Show Key"
                      }
                      variant="ghost"
                      onClick={() => toggleKeyVisibility(config.provider)}
                      className="absolute top-1/2 right-2 size-4 -translate-y-1/2 p-0 hover:bg-transparent"
                    >
                      {showKeys[config.provider] ? (
                        <EyeOffIcon className="size-3" />
                      ) : (
                        <EyeIcon className="size-3" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex flex-col gap-3">
            <Button
              onClick={() => onSubmit(apiKeyInputs)}
              disabled={!hasAtLeastOneKey}
              className="w-full"
            >
              Finish Setup
            </Button>
            <Button
              variant="outline"
              onClick={() => handleViewChange("account")}
            >
              Back to account options
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key="account"
      className={cn(
        "w-full max-w-md px-4 duration-500",
        isExiting
          ? "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards"
          : "animate-in slide-in-from-bottom-5 fade-in-0",
      )}
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-center text-4xl font-bold">
            Set up your account
          </h2>
          <p className="text-muted-foreground text-center text-base">
            An AgentOne account synchronizes your data across devices and allows
            you to access AgentOne models.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="default"
            size="lg"
            className="h-16 justify-between px-6 text-xl"
          >
            <span className="flex items-center gap-2">
              <div className="rounded-md p-2">
                <LogInIcon className="text-secondary size-6" />
              </div>
              Sign in with AgentOne
            </span>
            <ChevronRightIcon className="text-secondary size-4" />
          </Button>
          <Button
            variant="default"
            size="lg"
            className="h-16 justify-between px-6 text-xl"
          >
            <span className="flex items-center gap-2">
              <div className="rounded-md p-2">
                <UserPlusIcon className="text-secondary size-6" />
              </div>
              Create AgentOne account
            </span>
            <ChevronRightIcon className="text-secondary size-4" />
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="border-border w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-4">
                Or
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="h-16 justify-between px-6 text-xl"
            onClick={() => handleViewChange("byok")}
          >
            <span className="flex items-center gap-2">
              <div className="rounded-md p-2">
                <KeyIcon className="text-foreground size-6" />
              </div>
              Continue without an account
            </span>
            <ChevronRightIcon className="text-muted-foreground size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
