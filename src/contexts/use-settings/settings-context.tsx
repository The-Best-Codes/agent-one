import React, { type ReactNode, useCallback, useState } from "react";

import { getSetting, saveSetting } from "@/lib/settings/persistence";
import {
  DEFAULT_SETTINGS,
  type MarkdownRenderingOption,
  type SettingsType,
} from "@/lib/settings/types";

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

  const [markdownRendering, setMarkdownRendering] =
    useState<MarkdownRenderingOption>(
      () =>
        getSetting(
          "MARKDOWN_RENDERING",
          DEFAULT_SETTINGS.MARKDOWN_RENDERING,
        ) as MarkdownRenderingOption,
    );

  const handleSetMarkdownHighlighting = useCallback((value: boolean) => {
    setMarkdownHighlighting(value);
    saveSetting("MARKDOWN_HIGHLIGHTING", value);
  }, []);

  const handleSetMarkdownRendering = useCallback(
    (value: MarkdownRenderingOption) => {
      setMarkdownRendering(value);
      saveSetting("MARKDOWN_RENDERING", value);
    },
    [],
  );

  const settings: SettingsType = {
    MARKDOWN_HIGHLIGHTING: {
      value: markdownHighlighting,
      set: handleSetMarkdownHighlighting,
    },
    MARKDOWN_RENDERING: {
      value: markdownRendering,
      set: handleSetMarkdownRendering,
    },
  };

  return (
    <SettingsContext.Provider value={{ settings }}>
      {children}
    </SettingsContext.Provider>
  );
};
