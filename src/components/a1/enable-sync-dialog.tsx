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
          Keep your settings the same on every device you're signed in to.
        </DialogDescription>
      </DialogHeader>
      <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm">
        <li>If a setting is different on two devices, the most recent change is kept.</li>
        <li>Other devices update when they open, then about once an hour.</li>
        <li>Extensions and local folders stay on this device only.</li>
      </ul>
      <Field orientation="horizontal">
        <Checkbox
          id="sync-overwrite-remote"
          checked={overwriteRemote}
          onCheckedChange={(checked) => setOverwriteRemote(checked === true)}
        />
        <FieldContent>
          <FieldLabel htmlFor="sync-overwrite-remote">
            Make my other devices match this one
          </FieldLabel>
          <FieldDescription>
            Copies all of this device's settings everywhere, just this once. After that, sync works
            as usual.
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
