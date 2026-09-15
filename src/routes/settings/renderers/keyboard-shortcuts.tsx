import { IconBulb, IconPencil, IconRestore } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { useRecordHotkeys } from "react-hotkeys-hook";
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
  const [shortcuts, setShortcuts] = useAtom(keyboardShortcutsAtom);
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

export default function KeyboardShortcutsSection() {
  const [shortcuts, setShortcuts] = useAtom(keyboardShortcutsAtom);
  const [enabledInInputsDefault, setEnabledInInputsDefault] = useAtom(
    keyboardShortcutsEnabledInInputsAtom,
  );
  const [editingId, setEditingId] = useState<KeyboardShortcutId | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Keyboard Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-activate-shortcuts-in-input-fields">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-col items-start">
                <Label className="text-sm font-medium">Activate shortcuts in input fields</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  This is the default behavior. You can change it for individual shortcuts in the
                  shortcut editor.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={enabledInInputsDefault}
                  onCheckedChange={setEnabledInInputsDefault}
                  aria-label="Activate shortcuts in input fields"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={
                    enabledInInputsDefault === DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS
                  }
                  onClick={() => resetSetting("KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS")}
                  aria-label="Reset input field shortcut behavior"
                >
                  <IconRestore />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <div className="flex gap-1">
            <IconBulb className="size-5 shrink-0" />
            <span>
              You can change the send key in (<Kbd>Enter</Kbd> / <Kbd>Ctrl/CMD+Enter</Kbd>){" "}
              <Link to="/settings?tab=chats#setting-submit-key" className="underline">
                chat settings.
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
              );
            })}
          </div>
        </CardContent>
      </Card>

      {editingId && (
        <ShortcutEditor
          id={editingId}
          label={keyboardShortcutDefinitions.find((shortcut) => shortcut.id === editingId)!.label}
          enabledInInputsDefault={enabledInInputsDefault}
          open={Boolean(editingId)}
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}
    </div>
  );
}
