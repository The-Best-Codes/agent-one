import { useState } from "react";

const phrases = [
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
];

const getRandomPhrase = () => {
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
};

export const NoMessagesGreeting = () => {
  const [currentPhrase] = useState(getRandomPhrase);

  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-foreground animate-in slide-in-from-bottom fade-in-0 text-center text-2xl select-none">
        {currentPhrase}
      </h1>
    </div>
  );
};
