import React, { type ReactNode, useCallback, useState } from "react";

import { getSetting, saveSetting } from "@/lib/settings/persistence";
import { DEFAULT_SETTINGS, type SettingsType } from "@/lib/settings/types";

import { SettingsContext } from "./settings-contexts";

export interface SettingsContextType {
  settings: SettingsType;
}

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [markdownHighlighting, setMarkdownHighlighting] = useState(() =>
    getSetting("MARKDOWN_HIGHLIGHTING", DEFAULT_SETTINGS.MARKDOWN_HIGHLIGHTING),
  );

  const handleSetMarkdownHighlighting = useCallback((value: boolean) => {
    setMarkdownHighlighting(value);
    saveSetting("MARKDOWN_HIGHLIGHTING", value);
  }, []);

  const settings: SettingsType = {
    MARKDOWN_HIGHLIGHTING: {
      value: markdownHighlighting,
      set: handleSetMarkdownHighlighting,
    },
  };

  return (
    <SettingsContext.Provider value={{ settings }}>
      {children}
    </SettingsContext.Provider>
  );
};
