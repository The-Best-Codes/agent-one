import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";

interface EnableSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (overwriteRemote: boolean) => void;
}

const EnableSyncDialogBody = ({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: (overwriteRemote: boolean) => void;
}) => {
  const [overwriteRemote, setOverwriteRemote] = useState(false);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Turn on settings sync?</DialogTitle>
        <DialogDescription>
          Your settings will be kept in sync across every device signed in to your AgentOne account.
        </DialogDescription>
      </DialogHeader>
      <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm">
        <li>Settings you've changed on this device are uploaded to your account.</li>
        <li>Settings changed on your other devices are pulled down and applied here.</li>
        <li>If a setting was changed in more than one place, the most recent change wins.</li>
        <li>
          Other devices pick up changes when they start or sign in, and about once an hour after
          that.
        </li>
        <li>Device-specific things like extensions and local folders stay on this device.</li>
      </ul>
      <Field orientation="horizontal">
        <Checkbox
          id="sync-overwrite-remote"
          checked={overwriteRemote}
          onCheckedChange={(checked) => setOverwriteRemote(checked === true)}
        />
        <FieldContent>
          <FieldLabel htmlFor="sync-overwrite-remote">
            Apply this device's settings to all my devices
          </FieldLabel>
          <FieldDescription>
            Treats every setting here as the newest, including ones you haven't changed from the
            default, so your other devices are updated to match this one instead of this device
            pulling their changes.
          </FieldDescription>
        </FieldContent>
      </Field>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onConfirm(overwriteRemote)}>Turn on sync</Button>
      </DialogFooter>
    </>
  );
};

export const EnableSyncDialog = ({ open, onOpenChange, onConfirm }: EnableSyncDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <EnableSyncDialogBody
        onCancel={() => onOpenChange(false)}
        onConfirm={(overwriteRemote) => {
          onConfirm(overwriteRemote);
          onOpenChange(false);
        }}
      />
    </DialogContent>
  </Dialog>
);
