import { useAtom } from "jotai";
import { useState } from "react";

import {
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  openrouterApiKeyAtom,
  userNameAtom,
} from "@/lib/jotai/settings-atoms";

import { ApiKeysStep } from "./steps/api-keys";
import { NameStep } from "./steps/name";
import { SplashStep } from "./steps/splash";
import { WelcomeStep } from "./steps/welcome";

type OnboardingStep = "splash" | "name" | "api-keys" | "welcome";

export default function OnboardingRoute() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("splash");
  const [userName, setUserName] = useAtom(userNameAtom);
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

    setCurrentStep("welcome");
  };

  const handleWelcomeComplete = () => {
    window.location.href = "/";
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

      {currentStep === "welcome" && (
        <WelcomeStep name={userName} onComplete={handleWelcomeComplete} />
      )}
    </div>
  );
}
