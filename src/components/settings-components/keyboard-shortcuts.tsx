import { IconBulb, IconPencil, IconRestore } from "@tabler/icons-react";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { useRecordHotkeys } from "react-hotkeys-hook";

import { SettingsLink } from "@/components/a1/settings-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { type KeyboardShortcutId, keyboardShortcutDefinitions } from "@/lib/kbd-registry";
import { DEFAULT_SETTINGS } from "@/lib/settings/definitions";

import { SettingsTarget } from "./settings-target";

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
  const [shortcuts, setShortcuts] = useAtom(settingAtoms.KEYBOARD_SHORTCUTS);
  const current = shortcuts[id] ?? DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS[id];
  const [shortcut] = useState(current.shortcut);
  const [enabledInInputs, setEnabledInInputs] = useState<boolean | undefined>(
    current.enabledInInputs,
  );
  const [preventDefault, setPreventDefault] = useState(current.preventDefault);
  const [keys, { start, stop, resetKeys, isRecording }] = useRecordHotkeys();

  useEffect(() => () => stop(), [stop]);

  const recordedShortcut = Array.from(keys).join("+");
  const nextShortcut = recordedShortcut || shortcut;

  const conflict = useMemo(() => {
    return keyboardShortcutDefinitions.find((definition) => {
      if (definition.id === id) return false;
      const other = shortcuts[definition.id] ?? DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS[definition.id];
      return other.shortcut === nextShortcut;
    });
  }, [id, nextShortcut, shortcuts]);

  const handleSave = () => {
    stop();
    setShortcuts((currentShortcuts) => ({
      ...currentShortcuts,
      [id]: {
        shortcut: nextShortcut,
        enabledInInputs,
        preventDefault,
      },
    }));
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) stop();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent showCloseButton={false} onEscapeKeyDown={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit shortcut</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>

        <div className="bg-muted/40 flex min-h-24 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-4">
          <Kbd className="h-auto px-3 py-1 text-sm wrap-anywhere">
            {recordedShortcut || (!isRecording && shortcut) || "Press keys"}
          </Kbd>
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={() => {
              if (isRecording) {
                stop();
              } else {
                resetKeys();
                start();
              }
            }}
          >
            {isRecording ? "Stop" : "Record"}
          </Button>
        </div>

        {conflict && (
          <Alert variant="destructive">
            <AlertTitle>Shortcut conflict</AlertTitle>
            <AlertDescription>
              {`This shortcut is also used by ${conflict.label}.`}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <Label>Activate in input fields</Label>
            <Switch
              checked={enabledInInputs ?? enabledInInputsDefault}
              onCheckedChange={setEnabledInInputs}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label>Prevent default browser behavior</Label>
            <Switch checked={preventDefault} onCheckedChange={setPreventDefault} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={conflict ? "destructive" : "default"} onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OtherShortcutsAlert() {
  return (
    <Alert>
      <IconBulb />
      <AlertTitle>Other shortcuts</AlertTitle>
      <AlertDescription>
        The submit key and interrupt keyboard shortcuts are in{" "}
        <SettingsLink id="setting-submit-key" className="underline">
          chat settings.
        </SettingsLink>
      </AlertDescription>
    </Alert>
  );
}

export function ShortcutList() {
  const [shortcuts, setShortcuts] = useAtom(settingAtoms.KEYBOARD_SHORTCUTS);
  const enabledInInputsDefault = useAtomValue(settingAtoms.KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS);
  const [editingId, setEditingId] = useState<KeyboardShortcutId | null>(null);

  return (
    <>
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
            <SettingsTarget
              key={definition.id}
              id={`setting-shortcut-${definition.id}`}
              className="rounded-none"
            >
              <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <Label className="text-sm font-medium">{definition.label}</Label>
                  <p className="text-muted-foreground mt-1 text-xs">{definition.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Kbd>{config.shortcut}</Kbd>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setEditingId(definition.id)}
                      aria-label={`Edit ${definition.label}`}
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
                      aria-label={`Reset ${definition.label}`}
                    >
                      <IconRestore />
                    </Button>
                  </div>
                </div>
              </div>
            </SettingsTarget>
          );
        })}
      </div>

      {editingId && (
        <ShortcutEditor
          id={editingId}
          label={keyboardShortcutDefinitions.find((shortcut) => shortcut.id === editingId)!.label}
          enabledInInputsDefault={enabledInInputsDefault}
          open={Boolean(editingId)}
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}
    </>
  );
}
