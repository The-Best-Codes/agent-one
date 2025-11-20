import { useAtom } from "jotai";
import { useState } from "react";
import { useNavigate } from "react-router";

import {
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  openrouterApiKeyAtom,
  userNameAtom,
} from "@/lib/jotai/settings-atoms";

import { ApiKeysStep } from "./steps/api-keys";
import { NameStep } from "./steps/name";
import { SplashStep } from "./steps/splash";

type OnboardingStep = "splash" | "name" | "api-keys";

export default function OnboardingRoute() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("splash");
  const [, setUserName] = useAtom(userNameAtom);
  const [googleKey, setGoogleKey] = useAtom(googleGenerativeAiApiKeyAtom);
  const [groqKey, setGroqKey] = useAtom(groqApiKeyAtom);
  const [openrouterKey, setOpenrouterKey] = useAtom(openrouterApiKeyAtom);

  const handleGetStarted = () => {
    setCurrentStep("name");
  };

  const handleNameSubmit = (name: string) => {
    setUserName(name);
    setCurrentStep("api-keys");
  };

  const handleApiKeysComplete = (keys: Record<string, string>) => {
    if (keys.google) setGoogleKey(keys.google);
    if (keys.groq) setGroqKey(keys.groq);
    if (keys.openrouter) setOpenrouterKey(keys.openrouter);

    navigate("/chat");
  };

  const initialApiKeys = {
    google: googleKey,
    groq: groqKey,
    openrouter: openrouterKey,
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      {currentStep === "splash" && (
        <SplashStep onGetStarted={handleGetStarted} />
      )}

      {currentStep === "name" && <NameStep onSubmit={handleNameSubmit} />}

      {currentStep === "api-keys" && (
        <ApiKeysStep
          onSubmit={handleApiKeysComplete}
          initialKeys={initialApiKeys}
        />
      )}
    </div>
  );
}
