import { useEffect } from "react";

interface WelcomeStepProps {
  name: string;
  onComplete: () => void;
}

export function WelcomeStep({ name, onComplete }: WelcomeStepProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-foreground animate-in slide-in-from-bottom-5 fade-in-0 text-3xl font-bold duration-1000">
        Welcome, {name}
      </h1>
      <p className="text-muted-foreground animate-in slide-in-from-bottom-5 fade-in-0 text-lg duration-700">
        Just a moment...
      </p>
    </div>
  );
}
