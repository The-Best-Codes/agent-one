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
  const [appLanguage, setAppLanguage] = useState(() =>
    getSetting("APP_LANGUAGE", DEFAULT_SETTINGS.APP_LANGUAGE),
  );
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() =>
    getSetting("THEME_MODE", DEFAULT_SETTINGS.THEME_MODE),
  );
  const [autoSave, setAutoSave] = useState(() =>
    getSetting("AUTO_SAVE", DEFAULT_SETTINGS.AUTO_SAVE),
  );

  const handleSetAppLanguage = useCallback((value: string) => {
    setAppLanguage(value);
    saveSetting("APP_LANGUAGE", value);
  }, []);

  const handleSetThemeMode = useCallback(
    (value: "light" | "dark" | "system") => {
      setThemeMode(value);
      saveSetting("THEME_MODE", value);
    },
    [],
  );

  const handleSetAutoSave = useCallback((value: boolean) => {
    setAutoSave(value);
    saveSetting("AUTO_SAVE", value);
  }, []);

  const settings: SettingsType = {
    APP_LANGUAGE: {
      value: appLanguage,
      set: handleSetAppLanguage,
    },
    THEME_MODE: {
      value: themeMode,
      set: handleSetThemeMode,
    },
    AUTO_SAVE: {
      value: autoSave,
      set: handleSetAutoSave,
    },
  };

  return (
    <SettingsContext.Provider value={{ settings }}>
      {children}
    </SettingsContext.Provider>
  );
};
