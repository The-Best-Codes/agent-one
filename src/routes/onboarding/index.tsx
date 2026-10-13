import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { onboardingCompletedAtom, tourActiveAtom } from "@/lib/jotai/atoms";
import { settingAtoms } from "@/lib/jotai/settings-atoms";

import { AccountStep } from "./steps/account";
import { GreetingStep, NameStep } from "./steps/name";
import { SplashStep } from "./steps/splash";
import { WelcomeStep } from "./steps/welcome";

type OnboardingStep = "splash" | "account" | "name" | "greeting" | "welcome";

export default function OnboardingRoute() {
  const navigate = useNavigate();
  const [onboardingCompleted, setOnboardingCompleted] = useAtom(onboardingCompletedAtom);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("splash");
  const [userName, setUserName] = useAtom(settingAtoms.USER_NAME);
  const setTourActive = useSetAtom(tourActiveAtom);
  const { user } = useWebAuth();

  useEffect(() => {
    if (onboardingCompleted) {
      void navigate("/chat");
    }
  }, [onboardingCompleted, navigate]);

  const handleGetStarted = () => {
    setCurrentStep("account");
  };

  const handleSignedIn = () => {
    const name = userName.trim() || user?.name.trim() || "";
    if (!name) {
      setCurrentStep("name");
      return;
    }
    if (!userName.trim()) {
      setUserName(name);
    }
    setCurrentStep("greeting");
  };

  const handleContinueWithoutAccount = () => {
    setCurrentStep("name");
  };

  const handleNameSubmit = (name: string) => {
    setUserName(name);
    setCurrentStep("greeting");
  };

  const handleGreetingComplete = useCallback(() => {
    setCurrentStep("welcome");
  }, []);

  const handleWelcomeComplete = () => {
    setOnboardingCompleted(true);
  };

  const handleStartTour = () => {
    setTourActive(true);
    setOnboardingCompleted(true);
  };

  return (
    <main role="main" className="bg-background flex min-h-screen items-center justify-center">
      {currentStep === "splash" && <SplashStep onGetStarted={handleGetStarted} />}

      {currentStep === "account" && (
        <AccountStep
          onSignedIn={handleSignedIn}
          onContinueWithoutAccount={handleContinueWithoutAccount}
        />
      )}

      {currentStep === "name" && <NameStep onSubmit={handleNameSubmit} />}

      {currentStep === "greeting" && (
        <GreetingStep name={userName.trim()} onComplete={handleGreetingComplete} />
      )}

      {currentStep === "welcome" && (
        <WelcomeStep
          name={userName}
          onComplete={handleWelcomeComplete}
          onStartTour={handleStartTour}
        />
      )}
    </main>
  );
}
