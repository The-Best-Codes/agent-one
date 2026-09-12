import { useAtomValue } from "jotai";
import { useState } from "react";

import { userNameAtom } from "@/lib/jotai/settings-atoms";

const GREETINGS = [
  "What's on your mind?",
  "Where should we begin?",
  "How can I help you today?",
  "I'm all ears!",
  "What can I help with?",
  "Where should we start?",
  "Ask me anything.",
  "Ready when you are.",
  "What's on your mind today?",
  "What are you working on?",
  "What's on the agenda today?",
  "How can I help?",
  "What can I do for you?",
] as const;

export const NoMessagesGreeting = () => {
  const userName = useAtomValue(userNameAtom);
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const currentPhrase = userName ? greeting.replace(/[?.!]$/, `, ${userName}$&`) : greeting;

  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-foreground animate-in slide-in-from-bottom fade-in-0 pl-2 text-center text-2xl select-none">
        {currentPhrase}
      </h1>
    </div>
  );
};
