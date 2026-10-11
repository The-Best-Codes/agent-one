import { settingAtoms } from "@/lib/jotai/settings-atoms";

import { SETTING_KEYS, SETTINGS, type SettingKey } from "./definitions";

const INSPECTABLE_CONTROLS = new Set(["select", "switch", "number", "slider"]);

const inspectableKeys = SETTING_KEYS.filter((key) =>
  INSPECTABLE_CONTROLS.has(SETTINGS[key].control),
);

export function isInspectableKey(key: string): key is SettingKey {
  return (inspectableKeys as string[]).includes(key);
}

export function getInspectableKeys(): string[] {
  return inspectableKeys;
}

export interface SettingMetadata {
  key: string;
  label?: string;
  description?: string;
  type: string;
  options: readonly unknown[] | null;
  min?: number;
  max?: number;
  defaultValue: unknown;
}

export function getSettingMetadata(key: string): SettingMetadata | null {
  if (!isInspectableKey(key)) {
    return null;
  }

  const definition = SETTINGS[key];

  return {
    key,
    label: definition.label,
    description: definition.description,
    type: "options" in definition ? "enum" : typeof definition.default,
    options:
      "options" in definition
        ? Object.keys(definition.options)
        : typeof definition.default === "boolean"
          ? [true, false]
          : null,
    min: "min" in definition ? definition.min : undefined,
    max: "max" in definition ? definition.max : undefined,
    defaultValue: definition.default,
  };
}

export function getSettingAtom(key: string) {
  return isInspectableKey(key) ? settingAtoms[key] : null;
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
        error: `Value ${JSON.stringify(value)} is not a valid option. Valid options are: ${metadata.options.map((option) => JSON.stringify(option)).join(", ")}`,
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

  if (
    typeof value === "number" &&
    (!Number.isInteger(value) ||
      (metadata.min !== undefined && value < metadata.min) ||
      (metadata.max !== undefined && value > metadata.max))
  ) {
    return {
      success: false,
      error: `Expected a whole number between ${metadata.min} and ${metadata.max}`,
    };
  }

  return { success: true };
}
