import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import {
  cerebrasApiKeyAtom,
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  opencodeApiKeyAtom,
  openrouterApiKeyAtom,
} from "@/lib/jotai/api-key-atoms";
import { onboardingCompletedAtom } from "@/lib/jotai/atoms";
import { userNameAtom } from "@/lib/jotai/settings-atoms";

import { AccountStep } from "./steps/account";
import { NameStep } from "./steps/name";
import { SplashStep } from "./steps/splash";
import { WelcomeStep } from "./steps/welcome";

type OnboardingStep = "splash" | "name" | "account" | "welcome";

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
  const [opencodeKey, setOpencodeKey] = useAtom(opencodeApiKeyAtom);

  useEffect(() => {
    if (onboardingCompleted) {
      navigate("/chat");
    }
  }, [onboardingCompleted, navigate]);

  const handleGetStarted = () => {
    setCurrentStep("name");
  };

  const handleNameSubmit = (name: string) => {
    setUserName(name);
    setCurrentStep("account");
  };

  const handleAccountComplete = (keys: Record<string, string>) => {
    if (keys.cerebras) setCerebrasKey(keys.cerebras);
    if (keys.google) setGoogleKey(keys.google);
    if (keys.groq) setGroqKey(keys.groq);
    if (keys.openrouter) setOpenrouterKey(keys.openrouter);
    if (keys.opencode) setOpencodeKey(keys.opencode);

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
    opencode: opencodeKey,
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      {currentStep === "splash" && (
        <SplashStep onGetStarted={handleGetStarted} />
      )}

      {currentStep === "name" && <NameStep onSubmit={handleNameSubmit} />}

      {currentStep === "account" && (
        <AccountStep
          onSubmit={handleAccountComplete}
          initialKeys={initialApiKeys}
        />
      )}

      {currentStep === "welcome" && (
        <WelcomeStep name={userName} onComplete={handleWelcomeComplete} />
      )}
    </div>
  );
}
