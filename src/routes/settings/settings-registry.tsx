import type { ComponentType } from "react";

import type { SettingsSectionId } from "@/lib/settings/registry";

import AccountSyncSettings from "./custom-components/account-sync";
import AnalyticsSettings from "./custom-components/analytics";
import AppUpdateSettings from "./custom-components/app-updates";
import AppearanceSettings from "./custom-components/appearance";
import ChatAppearanceSettings from "./custom-components/chat-appearance";
import ChatBackgroundSettings from "./custom-components/chat-background";
import ChatBehaviorSettings from "./custom-components/chat-behavior";
import ChatTitleSettings from "./custom-components/chat-titles";
import ChatVirtualizationSettings from "./custom-components/chat-virtualization";
import DebugSettings from "./custom-components/debug";
import ExtensionRuntimeSettings from "./custom-components/extension-runtime";
import HelpSettings from "./custom-components/help";
import KeyboardShortcutSettings from "./custom-components/keyboard-shortcuts";
import ModelProviderSettings from "./custom-components/model-providers";
import ModelUpdateSettings from "./custom-components/model-updates";
import ProfileInstructionsSettings from "./custom-components/profile-instructions";
import RenderingLimitSettings from "./custom-components/rendering-limits";
import StreamingSettings from "./custom-components/streaming";
import TextToSpeechSettings from "./custom-components/text-to-speech";
import ExtensionsSettings from "./sections/extensions";

export const sections: Array<{
  id: SettingsSectionId;
  label: string;
  fillHeight?: boolean;
  requiresDebugMode?: boolean;
  component: ComponentType;
}> = [
  { id: "account", label: "Account & Sync", component: AccountSyncSettings },
  { id: "profile", label: "Profile & Instructions", component: ProfileInstructionsSettings },
  { id: "appearance", label: "Appearance", component: AppearanceSettings },
  { id: "chat-background", label: "Chat Background", component: ChatBackgroundSettings },
  { id: "chat-appearance", label: "Chat Appearance", component: ChatAppearanceSettings },
  { id: "chats", label: "Chat Behavior", component: ChatBehaviorSettings },
  { id: "streaming", label: "Streaming", component: StreamingSettings },
  { id: "chat-titles", label: "Chat Titles", component: ChatTitleSettings },
  { id: "rendering-limits", label: "Rendering Limits", component: RenderingLimitSettings },
  {
    id: "chat-virtualization",
    label: "Chat Virtualization",
    component: ChatVirtualizationSettings,
  },
  { id: "extension-runtime", label: "Extension Runtime", component: ExtensionRuntimeSettings },
  { id: "extensions", label: "Extensions", component: ExtensionsSettings, fillHeight: true },
  { id: "keyboard-shortcuts", label: "Keyboard Shortcuts", component: KeyboardShortcutSettings },
  { id: "providers", label: "Model Providers", component: ModelProviderSettings },
  { id: "text-to-speech", label: "Text-to-Speech", component: TextToSpeechSettings },
  { id: "app-updates", label: "App Updates", component: AppUpdateSettings },
  { id: "model-updates", label: "Model List Updates", component: ModelUpdateSettings },
  { id: "help", label: "Help", component: HelpSettings },
  { id: "analytics", label: "Usage Analytics", component: AnalyticsSettings },
  { id: "debug", label: "Debug", component: DebugSettings, requiresDebugMode: true },
];

const legacySectionIds: Record<string, SettingsSectionId> = {
  performance: "rendering-limits",
  about: "app-updates",
};

export function resolveSettingsSection(section: string): SettingsSectionId | undefined {
  return sections.find((candidate) => candidate.id === section)?.id ?? legacySectionIds[section];
}

export function isValidSection(section: string): section is SettingsSectionId {
  return resolveSettingsSection(section) !== undefined;
}

export function getSectionComponent(section: string): ComponentType | undefined {
  const resolvedSection = resolveSettingsSection(section);
  return sections.find((candidate) => candidate.id === resolvedSection)?.component;
}
