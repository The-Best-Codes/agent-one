import { useAtomValue } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { userNameAtom } from "@/lib/jotai/settings-atoms";

const GREETING_KEYS = [
  "empty.greetingMind",
  "empty.greetingBegin",
  "empty.greetingHelpToday",
  "empty.greetingEars",
  "empty.greetingHelpWith",
  "empty.greetingStart",
  "empty.greetingAnything",
  "empty.greetingReady",
  "empty.greetingMindToday",
  "empty.greetingWorking",
  "empty.greetingAgenda",
  "empty.greetingHelp",
  "empty.greetingDoForYou",
] as const;

const NAMED_GREETING_KEYS: Partial<Record<(typeof GREETING_KEYS)[number], string>> = {
  "empty.greetingMind": "empty.greetingMindNamed",
  "empty.greetingBegin": "empty.greetingBeginNamed",
  "empty.greetingHelpToday": "empty.greetingHelpTodayNamed",
  "empty.greetingEars": "empty.greetingEarsNamed",
  "empty.greetingHelpWith": "empty.greetingHelpWithNamed",
  "empty.greetingStart": "empty.greetingStartNamed",
  "empty.greetingMindToday": "empty.greetingMindTodayNamed",
  "empty.greetingWorking": "empty.greetingWorkingNamed",
  "empty.greetingAgenda": "empty.greetingAgendaNamed",
  "empty.greetingHelp": "empty.greetingHelpNamed",
  "empty.greetingDoForYou": "empty.greetingDoForYouNamed",
};

export const NoMessagesGreeting = () => {
  const { t } = useTranslation();
  const userName = useAtomValue(userNameAtom);
  const [greetingKey] = useState(
    () => GREETING_KEYS[Math.floor(Math.random() * GREETING_KEYS.length)],
  );
  const namedKey = NAMED_GREETING_KEYS[greetingKey];
  const currentPhrase =
    userName && namedKey ? t(namedKey, { name: userName }) : t(greetingKey);

  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-foreground animate-in slide-in-from-bottom fade-in-0 pl-2 text-center text-2xl select-none">
        {currentPhrase}
      </h1>
    </div>
  );
};
