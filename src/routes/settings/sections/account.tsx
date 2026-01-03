import { useAtom } from "jotai";
import { EyeIcon, EyeOffIcon, RotateCcwIcon, SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import {
  cerebrasApiKeyAtom,
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  openrouterApiKeyAtom,
} from "@/lib/jotai/api-key-atoms";
import {
  systemPromptAppendixAtom,
  userNameAtom,
} from "@/lib/jotai/settings-atoms";

interface ApiKeyField {
  atomId: string;
  label: string;
  placeholder: string;
}

const apiKeyFields: ApiKeyField[] = [
  {
    atomId: "cerebras",
    label: "Cerebras",
    placeholder: "Your Cerebras API key",
  },
  {
    atomId: "google",
    label: "Google Generative AI",
    placeholder: "Your Google Generative AI API key",
  },
  {
    atomId: "groq",
    label: "Groq",
    placeholder: "Your Groq API key",
  },
  {
    atomId: "openrouter",
    label: "OpenRouter",
    placeholder: "Your OpenRouter API key",
  },
];

const MAX_APPENDIX_CHARS = 2000;

export default function AccountSection() {
  const { isApiKeysLoading } = useApiKeys();
  const [userName, setUserName] = useAtom(userNameAtom);
  const [systemPromptAppendix, setSystemPromptAppendix] = useAtom(
    systemPromptAppendixAtom,
  );
  const [cerebrasKey, setCerebrasKey] = useAtom(cerebrasApiKeyAtom);
  const [googleKey, setGoogleKey] = useAtom(googleGenerativeAiApiKeyAtom);
  const [groqKey, setGroqKey] = useAtom(groqApiKeyAtom);
  const [openrouterKey, setOpenrouterKey] = useAtom(openrouterApiKeyAtom);

  const [nameInput, setNameInput] = useState(userName);
  const [appendixInput, setAppendixInput] = useState(systemPromptAppendix);
  const [cerebrasInput, setCerebrasInput] = useState(cerebrasKey);
  const [googleInput, setGoogleInput] = useState(googleKey);
  const [groqInput, setGroqInput] = useState(groqKey);
  const [openrouterInput, setOpenrouterInput] = useState(openrouterKey);

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    cerebras: false,
    google: false,
    groq: false,
    openrouter: false,
  });

  useEffect(() => {
    setUserName(nameInput);
  }, [nameInput, setUserName]);

  useEffect(() => {
    setSystemPromptAppendix(appendixInput);
  }, [appendixInput, setSystemPromptAppendix]);

  useEffect(() => {
    setCerebrasInput(cerebrasKey);
  }, [cerebrasKey]);

  useEffect(() => {
    setGoogleInput(googleKey);
  }, [googleKey]);

  useEffect(() => {
    setGroqInput(groqKey);
  }, [groqKey]);

  useEffect(() => {
    setOpenrouterInput(openrouterKey);
  }, [openrouterKey]);

  const handleSaveApiKey = (provider: string) => {
    switch (provider) {
      case "cerebras":
        setCerebrasKey(cerebrasInput);
        break;
      case "google":
        setGoogleKey(googleInput);
        break;
      case "groq":
        setGroqKey(groqInput);
        break;
      case "openrouter":
        setOpenrouterKey(openrouterInput);
        break;
    }
  };

  const handleCancelApiKey = (provider: string) => {
    switch (provider) {
      case "cerebras":
        setCerebrasInput(cerebrasKey);
        break;
      case "google":
        setGoogleInput(googleKey);
        break;
      case "groq":
        setGroqInput(groqKey);
        break;
      case "openrouter":
        setOpenrouterInput(openrouterKey);
        break;
    }
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getKeyState = (provider: string) => {
    switch (provider) {
      case "cerebras":
        return {
          value: cerebrasInput,
          set: setCerebrasInput,
          original: cerebrasKey,
        };
      case "google":
        return {
          value: googleInput,
          set: setGoogleInput,
          original: googleKey,
        };
      case "groq":
        return { value: groqInput, set: setGroqInput, original: groqKey };
      case "openrouter":
        return {
          value: openrouterInput,
          set: setOpenrouterInput,
          original: openrouterKey,
        };
      default:
        return { value: "", set: () => {}, original: "" };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-name" className="text-sm font-medium">
              Your Name
            </Label>
            <p className="text-muted-foreground text-sm">
              AgentOne will use this name to address you.
            </p>
            <Input
              id="user-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="system-prompt-appendix"
              className="text-sm font-medium"
            >
              AI Instructions
            </Label>
            <p className="text-muted-foreground text-sm">
              Add custom instructions that will be appended to the system
              prompt. These will guide how AgentOne responds to you.
            </p>
            <div className="relative">
              <Textarea
                id="system-prompt-appendix"
                value={appendixInput}
                onChange={(e) =>
                  setAppendixInput(e.target.value.slice(0, MAX_APPENDIX_CHARS))
                }
                placeholder="e.g., Always use British English. Be concise and technical."
                className="field-sizing-fixed max-h-96 min-h-15 resize-y"
              />
              <span className="text-muted-foreground pointer-events-none absolute right-2 bottom-2 text-xs">
                {appendixInput.length} / {MAX_APPENDIX_CHARS}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="text-muted-foreground text-sm">
            Your API keys are stored securely on your device. They are used to
            authenticate requests to the respective AI service providers.
          </p>

          {apiKeyFields.map((field) => {
            if (isApiKeysLoading) {
              return (
                <div key={field.atomId} className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="size-9" />
                    <Skeleton className="size-9" />
                    <Skeleton className="size-9" />
                  </div>
                </div>
              );
            }

            const keyState = getKeyState(field.atomId);
            const isVisible = showKeys[field.atomId];
            const hasChanges = keyState.value !== keyState.original;

            return (
              <div key={field.atomId} className="flex flex-col gap-2">
                <Label htmlFor={field.atomId} className="text-sm font-medium">
                  {field.label}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={field.atomId}
                    type={isVisible ? "text" : "password"}
                    value={keyState.value}
                    onChange={(e) => keyState.set(e.target.value)}
                    placeholder={field.placeholder}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => toggleKeyVisibility(field.atomId)}
                    variant="outline"
                    size="icon"
                    title={isVisible ? "Hide key" : "Show key"}
                  >
                    {isVisible ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() => handleSaveApiKey(field.atomId)}
                    disabled={!hasChanges}
                    variant="outline"
                    size="icon"
                    title="Save key"
                  >
                    <SaveIcon className="size-4" />
                  </Button>
                  <Button
                    onClick={() => handleCancelApiKey(field.atomId)}
                    disabled={!hasChanges}
                    variant="outline"
                    size="icon"
                    title="Cancel changes"
                  >
                    <RotateCcwIcon className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
