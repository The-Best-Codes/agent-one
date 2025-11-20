import { useAtom } from "jotai";
import { EyeIcon, EyeOffIcon } from "lucide-react";
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

  const handleSaveApiKeys = () => {
    setGoogleKey(googleInput);
    setGroqKey(groqInput);
    setOpenrouterKey(openrouterInput);
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getKeyAtom = (key: string) => {
    switch (key) {
      case "google":
        return { value: googleInput, set: setGoogleInput };
      case "groq":
        return { value: groqInput, set: setGroqInput };
      case "openrouter":
        return { value: openrouterInput, set: setOpenrouterInput };
      default:
        return { value: "", set: () => { } };
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
            <Input
              id="user-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
            />
            <Button
              onClick={handleSaveName}
              disabled={nameInput === userName}
              className="mt-2 w-full"
            >
              Save Name
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Your API keys are stored securely in your browser's local storage.
            They are used to authenticate requests to the respective AI service
            providers.
          </p>

          {apiKeyFields.map((field) => {
            const keyState = getKeyAtom(field.atomId);
            const isVisible = showKeys[field.atomId];

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
                  >
                    {isVisible ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          <Button
            onClick={handleSaveApiKeys}
            disabled={
              googleInput === googleKey &&
              groqInput === groqKey &&
              openrouterInput === openrouterKey
            }
            className="mt-2 w-full"
          >
            Save API Keys
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
