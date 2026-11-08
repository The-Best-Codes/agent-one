import {
  IconArrowBarToRight,
  IconArrowBigUp,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconBackspace,
  IconChevronUp,
  IconCommand,
  IconCornerDownLeft,
  IconOption,
  IconSpace,
} from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import type { ReactNode } from "react";

import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import type { KeyboardShortcutId } from "@/lib/kbd-registry";
import { DEFAULT_SETTINGS } from "@/lib/settings/definitions";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

const SHARED_KEY_LABELS: Record<string, ReactNode> = {
  shift: <IconArrowBigUp aria-label="Shift" />,
  enter: <IconCornerDownLeft aria-label="Enter" />,
  return: <IconCornerDownLeft aria-label="Enter" />,
  backspace: <IconBackspace aria-label="Backspace" />,
  space: <IconSpace aria-label="Space" />,
  tab: <IconArrowBarToRight aria-label="Tab" />,
  up: <IconArrowUp aria-label="Up" />,
  down: <IconArrowDown aria-label="Down" />,
  left: <IconArrowLeft aria-label="Left" />,
  right: <IconArrowRight aria-label="Right" />,
  esc: "Esc",
  escape: "Esc",
  delete: "Del",
  comma: ",",
  period: ".",
  slash: "/",
  backslash: "\\",
  minus: "-",
  equal: "=",
};

const MAC_KEY_LABELS: Record<string, ReactNode> = {
  mod: <IconCommand aria-label="Command" />,
  meta: <IconCommand aria-label="Command" />,
  cmd: <IconCommand aria-label="Command" />,
  ctrl: <IconChevronUp aria-label="Control" />,
  control: <IconChevronUp aria-label="Control" />,
  alt: <IconOption aria-label="Option" />,
  option: <IconOption aria-label="Option" />,
};

const OTHER_KEY_LABELS: Record<string, ReactNode> = {
  mod: "Ctrl",
  ctrl: "Ctrl",
  control: "Ctrl",
  meta: "Win",
  cmd: "Win",
  alt: "Alt",
  option: "Alt",
};

const PLATFORM_KEY_LABELS = isMac ? MAC_KEY_LABELS : OTHER_KEY_LABELS;

function formatKey(key: string) {
  const normalized = key.toLowerCase();
  const label = PLATFORM_KEY_LABELS[normalized] ?? SHARED_KEY_LABELS[normalized];
  if (label) return label;
  return normalized.length === 1 ? normalized.toUpperCase() : key[0].toUpperCase() + key.slice(1);
}

export function ShortcutKeys({ shortcut }: { shortcut: string }) {
  const combo = shortcut.split(",")[0]?.trim();
  const keys = combo ? combo.split(/[+-](?=.)/).filter(Boolean) : [];
  if (keys.length === 0) return null;

  return (
    <KbdGroup className="bg-muted in-data-[slot=tooltip-content]:bg-background/15 dark:in-data-[slot=tooltip-content]:bg-background/15 shrink-0 gap-0.5 rounded-md p-0.5 in-data-[slot=tooltip-content]:-my-0.5">
      {keys.map((key, index) => (
        <Kbd
          key={`${key}-${index}`}
          className="bg-background in-data-[slot=tooltip-content]:bg-background/30 dark:in-data-[slot=tooltip-content]:bg-foreground shadow-xs in-data-[slot=tooltip-content]:h-4 in-data-[slot=tooltip-content]:min-w-4 in-data-[slot=tooltip-content]:rounded-[3px] in-data-[slot=tooltip-content]:px-1 in-data-[slot=tooltip-content]:text-[10px] in-data-[slot=tooltip-content]:shadow-none dark:in-data-[slot=tooltip-content]:shadow-xs in-data-[slot=tooltip-content]:[&_svg:not([class*='size-'])]:size-2.5"
        >
          {formatKey(key)}
        </Kbd>
      ))}
    </KbdGroup>
  );
}

export function ShortcutKbd({ id }: { id: KeyboardShortcutId }) {
  const shortcuts = useAtomValue(settingAtoms.KEYBOARD_SHORTCUTS);
  const config = shortcuts[id] ?? DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS[id];
  if (!config.shortcut) return null;
  return <ShortcutKeys shortcut={config.shortcut} />;
}
