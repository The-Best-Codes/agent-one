import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { onboardingCompletedAtom } from "@/lib/jotai/atoms";
import { userNameAtom } from "@/lib/jotai/settings-atoms";

import { AccountStep } from "./steps/account";
import { NameStep } from "./steps/name";
import { SplashStep } from "./steps/splash";
import { WelcomeStep } from "./steps/welcome";

type OnboardingStep = "splash" | "name" | "account" | "welcome";

export default function OnboardingRoute() {
  const navigate = useNavigate();
  const [onboardingCompleted, setOnboardingCompleted] = useAtom(onboardingCompletedAtom);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("splash");
  const [userName, setUserName] = useAtom(userNameAtom);

  useEffect(() => {
    if (onboardingCompleted) {
      void navigate("/chat");
    }
  }, [onboardingCompleted, navigate]);

  const handleGetStarted = () => {
    setCurrentStep("name");
  };

  const handleNameSubmit = (name: string) => {
    setUserName(name);
    setCurrentStep("account");
  };

  const handleAccountComplete = () => {
    setCurrentStep("welcome");
  };

  const handleWelcomeComplete = () => {
    setOnboardingCompleted(true);
  };

  return (
    <main role="main" className="bg-background flex min-h-screen items-center justify-center">
      {currentStep === "splash" && <SplashStep onGetStarted={handleGetStarted} />}

      {currentStep === "name" && <NameStep onSubmit={handleNameSubmit} />}

      {currentStep === "account" && <AccountStep onSubmit={handleAccountComplete} />}

      {currentStep === "welcome" && (
        <WelcomeStep name={userName} onComplete={handleWelcomeComplete} />
      )}
    </main>
  );
}
