import { IconBug } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useState } from "react";

import { userNameAtom } from "@/lib/jotai/settings-atoms";

const getPhrases = (userName: string) => [
  userName ? `What's on your mind, ${userName}?` : "What's on your mind?",
  userName ? `Where should we begin, ${userName}?` : "Where should we begin?",
  userName ? `How can I help you today, ${userName}?` : "How can I help you today?",
  userName ? `I'm all ears, ${userName}!` : "I'm all ears!",
  userName ? `What can I help with, ${userName}?` : "What can I help with?",
  userName ? `Where should we start, ${userName}?` : "Where should we start?",
  "Ask me anything.",
  "Ready when you are.",
  userName ? `What's on your mind today, ${userName}?` : "What's on your mind today?",
  userName ? `What are you working on, ${userName}?` : "What are you working on?",
  userName ? `What's on the agenda today, ${userName}?` : "What's on the agenda today?",
  userName ? `How can I help, ${userName}?` : "How can I help?",
  userName ? `What can I do for you, ${userName}?` : "What can I do for you?",
];

const getRandomPhrase = (phrases: string[]) => {
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
};

export const NoMessagesGreeting = ({ hasChatId }: { hasChatId?: boolean }) => {
  const userName = useAtomValue(userNameAtom);
  const phrases = getPhrases(userName);
  const [currentPhrase] = useState(() => getRandomPhrase(phrases));

  if (hasChatId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 pl-2">
        <IconBug className="text-muted-foreground size-10" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-foreground text-lg font-medium">No messages found</p>
          <p className="text-muted-foreground max-w-xs text-center text-sm">
            This chat appears to have no messages. This is likely a bug.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-foreground animate-in slide-in-from-bottom fade-in-0 pl-2 text-center text-2xl select-none">
        {currentPhrase}
      </h1>
    </div>
  );
};
