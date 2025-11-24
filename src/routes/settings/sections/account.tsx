import { useAtom } from "jotai";
import { EyeIcon, EyeOffIcon, RotateCcwIcon, SaveIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  openrouterApiKeyAtom,
  userNameAtom,
} from "@/lib/jotai/settings-atoms";

interface ApiKeyField {
  atomId: string;
  label: string;
  placeholder: string;
}

const apiKeyFields: ApiKeyField[] = [
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

export default function AccountSection() {
  const [userName, setUserName] = useAtom(userNameAtom);
  const [googleKey, setGoogleKey] = useAtom(googleGenerativeAiApiKeyAtom);
  const [groqKey, setGroqKey] = useAtom(groqApiKeyAtom);
  const [openrouterKey, setOpenrouterKey] = useAtom(openrouterApiKeyAtom);

  const [nameInput, setNameInput] = useState(userName);
  const [googleInput, setGoogleInput] = useState(googleKey);
  const [groqInput, setGroqInput] = useState(groqKey);
  const [openrouterInput, setOpenrouterInput] = useState(openrouterKey);

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    google: false,
    groq: false,
    openrouter: false,
  });

  const handleSaveName = () => {
    setUserName(nameInput);
  };

  const handleCancelName = () => {
    setNameInput(userName);
  };

  const handleSaveApiKey = (provider: string) => {
    switch (provider) {
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
    window.location.reload();
  };

  const handleCancelApiKey = (provider: string) => {
    switch (provider) {
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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-name" className="text-sm font-medium">
              Your Name
            </Label>
            <p className="text-muted-foreground text-sm">
              AgentOne will use this name to address you.
            </p>
            <div className="flex gap-2">
              <Input
                id="user-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                className="flex-1"
              />
              <Button
                onClick={handleSaveName}
                disabled={nameInput === userName}
                variant="outline"
                size="icon"
                title="Save name"
              >
                <SaveIcon className="size-4" />
              </Button>
              <Button
                onClick={handleCancelName}
                disabled={nameInput === userName}
                variant="outline"
                size="icon"
                title="Cancel changes"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Your API keys are stored securely on your device. They are used to
            authenticate requests to the respective AI service providers.
          </p>

          {apiKeyFields.map((field) => {
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
                    title="Save key and reload"
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
