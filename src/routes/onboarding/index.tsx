import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { apiKeyAtoms } from "@/lib/jotai/api-key-atoms";
import { onboardingCompletedAtom } from "@/lib/jotai/atoms";
import { userNameAtom } from "@/lib/jotai/settings-atoms";
import { PROVIDER_REGISTRY } from "@/lib/providers/registry";

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

  const [openrouterKey, setOpenrouterKey] = useAtom(
    apiKeyAtoms.openrouter.atom,
  );
  const [groqKey, setGroqKey] = useAtom(apiKeyAtoms.groq.atom);
  const [googleKey, setGoogleKey] = useAtom(apiKeyAtoms.google.atom);
  const [cerebrasKey, setCerebrasKey] = useAtom(apiKeyAtoms.cerebras.atom);

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
    if (keys.openrouter) setOpenrouterKey(keys.openrouter);
    if (keys.groq) setGroqKey(keys.groq);
    if (keys.google) setGoogleKey(keys.google);
    if (keys.cerebras) setCerebrasKey(keys.cerebras);
    setCurrentStep("welcome");
  };

  const handleWelcomeComplete = () => {
    setOnboardingCompleted(true);
  };

  const initialApiKeys = Object.fromEntries(
    PROVIDER_REGISTRY.map((p) => {
      const key =
        p.id === "openrouter"
          ? openrouterKey
          : p.id === "groq"
            ? groqKey
            : p.id === "google"
              ? googleKey
              : cerebrasKey;
      return [p.id, key];
    }),
  );

  return (
    <main
      role="main"
      className="bg-background flex min-h-screen items-center justify-center"
    >
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
    </main>
  );
}
