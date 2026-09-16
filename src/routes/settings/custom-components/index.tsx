import type { ComponentType } from "react";

import type {
  SettingComponentId,
  SettingDefinition,
  SettingGroupDefinition,
} from "@/lib/settings/registry";

import AccountOverview from "./account-overview";
import { AnalyticsEnabledControl, AnalyticsIdentityControl } from "./analytics-settings";
import AppUpdateSettings from "./app-update-settings";
import {
  ChatBackgroundEffects,
  ChatBackgroundOverlay,
  ChatBackgroundPicker,
} from "./chat-background-settings";
import DebugSettings from "./debug-settings";
import ExtensionsSettings from "./extensions";
import HelpSettings from "./help-settings";
import KeyboardShortcutList from "./keyboard-shortcuts";
import MemorySettings from "./memory-settings";
import ModelDirectorySettings from "./model-directory-settings";
import BuiltInProvidersSettings from "./providers/built-in-providers";
import CustomProvidersSettings from "./providers/custom-providers";
import LocalProvidersSettings from "./providers/local-providers";
import TextToSpeechSettings from "./text-to-speech";

export interface CustomSettingComponentProps {
  group: SettingGroupDefinition;
  setting?: SettingDefinition;
}

/**
 * Every custom setting UI, keyed by the `componentId` used in the settings registry.
 * The record type is exhaustive, so adding a `SettingComponentId` without a matching
 * component is a type error.
 */
export const customSettingComponents: Record<
  SettingComponentId,
  ComponentType<CustomSettingComponentProps>
> = {
  "account-overview": AccountOverview,
  "analytics-enabled": AnalyticsEnabledControl,
  "analytics-identity": AnalyticsIdentityControl,
  "app-update": AppUpdateSettings,
  "chat-background": ChatBackgroundPicker,
  "chat-background-effects": ChatBackgroundEffects,
  "chat-background-overlay": ChatBackgroundOverlay,
  "built-in-providers": BuiltInProvidersSettings,
  "local-providers": LocalProvidersSettings,
  "custom-providers": CustomProvidersSettings,
  "text-to-speech": TextToSpeechSettings,
  extensions: ExtensionsSettings,
  help: HelpSettings,
  "keyboard-shortcuts": KeyboardShortcutList,
  memory: MemorySettings,
  "model-directory": ModelDirectorySettings,
  "debug-tools": DebugSettings,
};

export function getCustomSettingComponent(
  id: SettingComponentId,
): ComponentType<CustomSettingComponentProps> {
  return customSettingComponents[id];
}
