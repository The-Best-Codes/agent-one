import { IconBulb, IconPencil, IconRestore } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  keyboardShortcutsAtom,
  keyboardShortcutsEnabledInInputsAtom,
} from "@/lib/jotai/settings-atoms";
import { type KeyboardShortcutId, keyboardShortcutDefinitions } from "@/lib/kbd-registry";
import { resetSetting } from "@/lib/settings/reset-settings";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";

import SettingsTarget from "../settings-target";

function formatKey(key: string) {
  if (key === " ") return "space";
  if (key === "Escape") return "esc";
  if (key === ",") return "comma";
  if (key === ".") return "period";
  return key.toLowerCase();
}

function eventToShortcut(event: KeyboardEvent) {
  const key = formatKey(event.key);
  const modifiers = [
    event.ctrlKey && "ctrl",
    event.metaKey && "meta",
    event.altKey && "alt",
    event.shiftKey && "shift",
  ].filter(Boolean);

  if (["ctrl", "meta", "alt", "shift"].includes(key)) {
    return modifiers.join("+");
  }

  return [...modifiers, key].join("+");
}

function ShortcutEditor({
  id,
  label,
  enabledInInputsDefault,
  open,
  onOpenChange,
}: {
  id: KeyboardShortcutId;
  label: string;
  enabledInInputsDefault: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [shortcuts, setShortcuts] = useAtom(keyboardShortcutsAtom);
  const current = shortcuts[id] ?? DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS[id];
  const [shortcut, setShortcut] = useState(current.shortcut);
  const [enabledInInputs, setEnabledInInputs] = useState<boolean | undefined>(
    current.enabledInInputs,
  );
  const [preventDefault, setPreventDefault] = useState(current.preventDefault);

  const conflict = useMemo(() => {
    return keyboardShortcutDefinitions.find((definition) => {
      if (definition.id === id) return false;
      const other = shortcuts[definition.id] ?? DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS[definition.id];
      return other.shortcut === shortcut;
    });
  }, [id, shortcut, shortcuts]);

  const handleSave = () => {
    setShortcuts((currentShortcuts) => ({
      ...currentShortcuts,
      [id]: {
        shortcut,
        enabledInInputs,
        preventDefault,
      },
    }));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setShortcut(eventToShortcut(event.nativeEvent));
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("shortcuts.editShortcut")}</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>

        <button
          type="button"
          className="bg-muted/40 flex min-h-24 items-center justify-center rounded-lg border border-dashed p-4"
          autoFocus
        >
          <Kbd className="h-auto px-3 py-1 text-sm">{shortcut || t("shortcuts.pressKeys")}</Kbd>
        </button>

        {conflict && (
          <Alert variant="destructive">
            <AlertTitle>{t("shortcuts.conflictTitle")}</AlertTitle>
            <AlertDescription>
              {t("shortcuts.conflictDescription", { label: t(conflict.labelKey) })}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <Label>{t("shortcuts.activateInInputs")}</Label>
            <Switch
              checked={enabledInInputs ?? enabledInInputsDefault}
              onCheckedChange={setEnabledInInputs}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label>{t("shortcuts.preventDefault")}</Label>
            <Switch checked={preventDefault} onCheckedChange={setPreventDefault} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant={conflict ? "destructive" : "default"} onClick={handleSave}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function KeyboardShortcutsSection() {
  const { t } = useTranslation();
  const [shortcuts, setShortcuts] = useAtom(keyboardShortcutsAtom);
  const [enabledInInputsDefault, setEnabledInInputsDefault] = useAtom(
    keyboardShortcutsEnabledInInputsAtom,
  );
  const [editingId, setEditingId] = useState<KeyboardShortcutId | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("shortcuts.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-activate-shortcuts-in-input-fields">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-col items-start">
                <Label className="text-sm font-medium">
                  {t("shortcuts.activateInInputsLabel")}
                </Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("shortcuts.activateInInputsDescription")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={enabledInInputsDefault}
                  onCheckedChange={setEnabledInInputsDefault}
                  aria-label={t("shortcuts.activateInInputsLabel")}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={
                    enabledInInputsDefault === DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS
                  }
                  onClick={() => resetSetting("KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS")}
                  aria-label={t("shortcuts.resetInputBehavior")}
                >
                  <IconRestore />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <div className="flex gap-1">
            <IconBulb className="size-5 shrink-0" />
            <span>
              {t("shortcuts.sendKeyHint")} (<Kbd>Enter</Kbd> / <Kbd>Ctrl+Enter</Kbd>){" "}
              <Link to="/settings?tab=chats#setting-submit-key" className="underline">
                {t("shortcuts.chatSettings")}
              </Link>
            </span>
          </div>

          <div className="divide-y rounded-md border">
            {keyboardShortcutDefinitions.map((definition) => {
              const config =
                shortcuts[definition.id] ?? DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS[definition.id];
              const defaultConfig = DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS[definition.id];
              const isDefault =
                config.shortcut === defaultConfig.shortcut &&
                config.preventDefault === defaultConfig.preventDefault &&
                config.enabledInInputs === defaultConfig.enabledInInputs;

              return (
                <div
                  key={definition.id}
                  className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <Label className="text-sm font-medium">{t(definition.labelKey)}</Label>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {t(definition.descriptionKey)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Kbd>{config.shortcut}</Kbd>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setEditingId(definition.id)}
                        aria-label={t("shortcuts.editAria", { label: t(definition.labelKey) })}
                      >
                        <IconPencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isDefault}
                        onClick={() => {
                          setShortcuts((currentShortcuts) => ({
                            ...currentShortcuts,
                            [definition.id]: defaultConfig,
                          }));
                        }}
                        aria-label={t("shortcuts.resetAria", { label: t(definition.labelKey) })}
                      >
                        <IconRestore />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {editingId && (
        <ShortcutEditor
          id={editingId}
          label={t(
            keyboardShortcutDefinitions.find((shortcut) => shortcut.id === editingId)!.labelKey,
          )}
          enabledInInputsDefault={enabledInInputsDefault}
          open={Boolean(editingId)}
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}
    </div>
  );
}
