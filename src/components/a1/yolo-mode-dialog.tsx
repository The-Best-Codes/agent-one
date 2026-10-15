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
import { Field, FieldLabel } from "@/components/ui/field";

interface YoloModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dontShowAgain: boolean) => void;
}

const YoloModeDialogBody = ({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: (dontShowAgain: boolean) => void;
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Turn on YOLO mode?</DialogTitle>
        <DialogDescription>
          AgentOne will run tools without asking you first. This includes tools that can edit or
          delete files, run commands on your computer, and change your settings. Only turn this on
          if you trust the model and the tools you have enabled.
        </DialogDescription>
      </DialogHeader>
      <Field orientation="horizontal">
        <Checkbox
          id="yolo-dont-show-again"
          checked={dontShowAgain}
          onCheckedChange={(checked) => setDontShowAgain(checked === true)}
        />
        <FieldLabel htmlFor="yolo-dont-show-again">Don't show this again</FieldLabel>
      </Field>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={() => onConfirm(dontShowAgain)}>
          Turn on YOLO mode
        </Button>
      </DialogFooter>
    </>
  );
};

export const YoloModeDialog = ({ open, onOpenChange, onConfirm }: YoloModeDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <YoloModeDialogBody
        onCancel={() => onOpenChange(false)}
        onConfirm={(dontShowAgain) => {
          onConfirm(dontShowAgain);
          onOpenChange(false);
        }}
      />
    </DialogContent>
  </Dialog>
);
