import { useEffect, useState } from "react";

export const NoMessagesGreeting = () => {
  const [currentPhrase, setCurrentPhrase] = useState("");

  useEffect(() => {
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

    const randomIndex = Math.floor(Math.random() * phrases.length);
    setCurrentPhrase(phrases[randomIndex]);
  }, []);

  return (
    <div className="flex justify-center items-center h-full">
      <h1 className="text-2xl text-center text-foreground">{currentPhrase}</h1>
    </div>
  );
};
