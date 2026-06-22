import * as atoms from "@/lib/jotai/settings-atoms";

import { DEFAULT_SETTINGS } from "./types";
import * as types from "./types";

function keyToAtomName(key: string): string {
  if (key === "TTS") return "ttsSettingsAtom";
  const camelCase = key.toLowerCase().replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  return `${camelCase}Atom`;
}

export function getInspectableKeys(): string[] {
  return Object.keys(DEFAULT_SETTINGS).filter((key) => {
    // Exclude security tokens, complex maps, and objects
    if (
      key.endsWith("_API_KEY") ||
      key.endsWith("_TOKEN") ||
      key === "ABLIT_KEY" ||
      key === "AGENT_ONE_API_KEY" ||
      key === "KEYBOARD_SHORTCUTS" ||
      key === "MCP_SERVERS" ||
      key === "TOOL_CONFIGS" ||
      key === "ENABLED_TOOLS" ||
      key === "CHAT_BACKGROUND" ||
      key === "MEMORY"
    ) {
      return false;
    }

    const atomName = keyToAtomName(key);
    return atomName in atoms;
  });
}

export interface SettingMetadata {
  key: string;
  type: string;
  options: readonly unknown[] | null;
  defaultValue: unknown;
}

export function getSettingMetadata(key: string): SettingMetadata | null {
  if (!getInspectableKeys().includes(key)) {
    return null;
  }

  const defaultValue = DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS];
  const optionKey = `${key}_OPTIONS`;
  const options = (types as Record<string, unknown>)[optionKey] as readonly unknown[] | undefined;

  let type: string = typeof defaultValue;
  if (options) {
    type = "enum";
  } else if (Array.isArray(defaultValue)) {
    type = "array";
  }

  return {
    key,
    type,
    options: options || (type === "boolean" ? [true, false] : null),
    defaultValue,
  };
}

export function getSettingAtom(key: string) {
  const atomName = keyToAtomName(key);
  return (atoms as Record<string, unknown>)[atomName];
}

export function validateSettingValue(
  key: string,
  value: unknown,
): { success: boolean; error?: string } {
  const metadata = getSettingMetadata(key);
  if (!metadata) {
    return { success: false, error: `Invalid or non-inspectable setting key: "${key}"` };
  }

  if (metadata.options) {
    if (!metadata.options.includes(value)) {
      return {
        success: false,
        error: `Value ${JSON.stringify(value)} is not a valid option. Valid options are: ${metadata.options.map((o) => JSON.stringify(o)).join(", ")}`,
      };
    }
    return { success: true };
  }

  const expectedType = typeof metadata.defaultValue;
  if (typeof value !== expectedType) {
    return {
      success: false,
      error: `Expected type ${expectedType}, but received ${typeof value}`,
    };
  }

  return { success: true };
}
