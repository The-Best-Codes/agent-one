import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import {
  cerebrasApiKeyAtom,
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  openrouterApiKeyAtom,
} from "@/lib/jotai/api-key-atoms";
import { onboardingCompletedAtom } from "@/lib/jotai/atoms";
import { userNameAtom } from "@/lib/jotai/settings-atoms";

import { ApiKeysStep } from "./steps/api-keys";
import { NameStep } from "./steps/name";
import { SplashStep } from "./steps/splash";
import { WelcomeStep } from "./steps/welcome";

type OnboardingStep = "splash" | "name" | "api-keys" | "welcome";

export default function OnboardingRoute() {
  const navigate = useNavigate();
  const [onboardingCompleted, setOnboardingCompleted] = useAtom(
    onboardingCompletedAtom,
  );
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("splash");
  const [userName, setUserName] = useAtom(userNameAtom);
  const [cerebrasKey, setCerebrasKey] = useAtom(cerebrasApiKeyAtom);
  const [googleKey, setGoogleKey] = useAtom(googleGenerativeAiApiKeyAtom);
  const [groqKey, setGroqKey] = useAtom(groqApiKeyAtom);
  const [openrouterKey, setOpenrouterKey] = useAtom(openrouterApiKeyAtom);

  useEffect(() => {
    if (onboardingCompleted) {
      navigate("/");
    }
  }, [onboardingCompleted, navigate]);

  const handleGetStarted = () => {
    setCurrentStep("name");
  };

  const handleNameSubmit = (name: string) => {
    setUserName(name);
    setCurrentStep("api-keys");
  };

  const handleApiKeysComplete = (keys: Record<string, string>) => {
    if (keys.cerebras) setCerebrasKey(keys.cerebras);
    if (keys.google) setGoogleKey(keys.google);
    if (keys.groq) setGroqKey(keys.groq);
    if (keys.openrouter) setOpenrouterKey(keys.openrouter);

    setCurrentStep("welcome");
  };

  const handleWelcomeComplete = () => {
    setOnboardingCompleted(true);
  };

  const initialApiKeys = {
    cerebras: cerebrasKey,
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
