import React, { type ReactNode, useCallback, useState } from "react";

import { getSetting, saveSetting } from "@/lib/settings/persistence";
import {
  DEFAULT_SETTINGS,
  type MarkdownRenderingOption,
  type SettingsType,
  type SubmitKeyOption,
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

  const [submitKey, setSubmitKey] = useState<SubmitKeyOption>(
    () =>
      getSetting("SUBMIT_KEY", DEFAULT_SETTINGS.SUBMIT_KEY) as SubmitKeyOption,
  );

  const [maxCodeblockChars, setMaxCodeblockChars] = useState(() =>
    getSetting("MAX_CODEBLOCK_CHARS", DEFAULT_SETTINGS.MAX_CODEBLOCK_CHARS),
  );

  const [maxMessageLength, setMaxMessageLength] = useState(() =>
    getSetting("MAX_MESSAGE_LENGTH", DEFAULT_SETTINGS.MAX_MESSAGE_LENGTH),
  );

  const [experimentalThrottleEnabled, setExperimentalThrottleEnabled] =
    useState(() =>
      getSetting(
        "EXPERIMENTAL_THROTTLE_ENABLED",
        DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_ENABLED,
      ),
    );

  const [experimentalThrottleValue, setExperimentalThrottleValue] = useState(
    () =>
      getSetting(
        "EXPERIMENTAL_THROTTLE_VALUE",
        DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_VALUE,
      ),
  );

  const [smoothStreamEnabled, setSmoothStreamEnabled] = useState(() =>
    getSetting("SMOOTH_STREAM_ENABLED", DEFAULT_SETTINGS.SMOOTH_STREAM_ENABLED),
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

  const handleSetSubmitKey = useCallback((value: SubmitKeyOption) => {
    setSubmitKey(value);
    saveSetting("SUBMIT_KEY", value);
  }, []);

  const handleSetMaxCodeblockChars = useCallback((value: number) => {
    setMaxCodeblockChars(value);
    saveSetting("MAX_CODEBLOCK_CHARS", value);
  }, []);

  const handleSetMaxMessageLength = useCallback((value: number) => {
    setMaxMessageLength(value);
    saveSetting("MAX_MESSAGE_LENGTH", value);
  }, []);

  const handleSetExperimentalThrottleEnabled = useCallback((value: boolean) => {
    setExperimentalThrottleEnabled(value);
    saveSetting("EXPERIMENTAL_THROTTLE_ENABLED", value);
  }, []);

  const handleSetExperimentalThrottleValue = useCallback((value: number) => {
    setExperimentalThrottleValue(value);
    saveSetting("EXPERIMENTAL_THROTTLE_VALUE", value);
  }, []);

  const handleSetSmoothStreamEnabled = useCallback((value: boolean) => {
    setSmoothStreamEnabled(value);
    saveSetting("SMOOTH_STREAM_ENABLED", value);
  }, []);

  const settings: SettingsType = {
    MARKDOWN_HIGHLIGHTING: {
      value: markdownHighlighting,
      set: handleSetMarkdownHighlighting,
    },
    MARKDOWN_RENDERING: {
      value: markdownRendering,
      set: handleSetMarkdownRendering,
    },
    SUBMIT_KEY: {
      value: submitKey,
      set: handleSetSubmitKey,
    },
    MAX_CODEBLOCK_CHARS: {
      value: maxCodeblockChars,
      set: handleSetMaxCodeblockChars,
    },
    MAX_MESSAGE_LENGTH: {
      value: maxMessageLength,
      set: handleSetMaxMessageLength,
    },
    EXPERIMENTAL_THROTTLE_ENABLED: {
      value: experimentalThrottleEnabled,
      set: handleSetExperimentalThrottleEnabled,
    },
    EXPERIMENTAL_THROTTLE_VALUE: {
      value: experimentalThrottleValue,
      set: handleSetExperimentalThrottleValue,
    },
    SMOOTH_STREAM_ENABLED: {
      value: smoothStreamEnabled,
      set: handleSetSmoothStreamEnabled,
    },
  };

  return (
    <SettingsContext.Provider value={{ settings }}>
      {children}
    </SettingsContext.Provider>
  );
};
