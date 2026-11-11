import { type FormEvent, useEffect, useState } from "react";

import { CopyButton } from "@/components/a1/copy-button";
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { encryptedSyncManager, type EncryptedVault } from "@/lib/sync/encrypted-sync-manager";

const MIN_PASSPHRASE_LENGTH = 8;

type Step =
  | { kind: "loading" }
  | { kind: "load-error"; message: string }
  | { kind: "create" }
  | { kind: "recovery-key"; recoveryKey: string }
  | { kind: "unlock"; vault: EncryptedVault }
  | { kind: "reset"; vault: EncryptedVault };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

interface EncryptedSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EncryptedSyncDialog = ({ open, onOpenChange }: EncryptedSyncDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      {open && <EncryptedSyncDialogBody onDone={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>
);

const EncryptedSyncDialogBody = ({ onDone }: { onDone: () => void }) => {
  const [step, setStep] = useState<Step>({ kind: "loading" });

  const [loadCount, setLoadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    encryptedSyncManager.getServerVault().then(
      (vault) => {
        if (!cancelled) setStep(vault ? { kind: "unlock", vault } : { kind: "create" });
      },
      (error: unknown) => {
        if (!cancelled) setStep({ kind: "load-error", message: errorMessage(error) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loadCount]);

  const loadVault = () => {
    setStep({ kind: "loading" });
    setLoadCount((count) => count + 1);
  };

  switch (step.kind) {
    case "loading":
      return (
        <>
          <DialogHeader>
            <DialogTitle>Sync API keys</DialogTitle>
            <DialogDescription>Checking your account…</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        </>
      );
    case "load-error":
      return (
        <>
          <DialogHeader>
            <DialogTitle>Sync API keys</DialogTitle>
            <DialogDescription>We couldn't reach your AgentOne account.</DialogDescription>
          </DialogHeader>
          <FieldError>{step.message}</FieldError>
          <DialogFooter>
            <Button variant="outline" onClick={onDone}>
              Cancel
            </Button>
            <Button onClick={loadVault}>Try again</Button>
          </DialogFooter>
        </>
      );
    case "create":
      return (
        <CreateStep
          onCancel={onDone}
          onCreated={(recoveryKey) => setStep({ kind: "recovery-key", recoveryKey })}
          onVaultExists={loadVault}
        />
      );
    case "recovery-key":
      return <RecoveryKeyStep recoveryKey={step.recoveryKey} onDone={onDone} />;
    case "unlock":
      return (
        <UnlockStep
          vault={step.vault}
          onCancel={onDone}
          onUnlocked={onDone}
          onForgot={() => setStep({ kind: "reset", vault: step.vault })}
        />
      );
    case "reset":
      return (
        <ResetStep
          vault={step.vault}
          onBack={() => setStep({ kind: "unlock", vault: step.vault })}
          onReset={() => setStep({ kind: "create" })}
        />
      );
  }
};

const CreateStep = ({
  onCancel,
  onCreated,
  onVaultExists,
}: {
  onCancel: () => void;
  onCreated: (recoveryKey: string) => void;
  onVaultExists: () => void;
}) => {
  const [passphrase, setPassphrase] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
      setError(`Use at least ${MIN_PASSPHRASE_LENGTH} characters.`);
      return;
    }
    if (passphrase !== confirmation) {
      setError("The passphrases don't match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      onCreated(await encryptedSyncManager.createVault(passphrase));
    } catch (createError) {
      const existing = await encryptedSyncManager.getServerVault().catch(() => null);
      if (existing) {
        onVaultExists();
        return;
      }
      setError(errorMessage(createError));
      setSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
      <DialogHeader>
        <DialogTitle>Create a sync passphrase</DialogTitle>
        <DialogDescription>
          Your API keys are locked with this passphrase before they leave this device. AgentOne
          can't read them or reset the passphrase for you.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="encrypted-sync-passphrase">Passphrase</FieldLabel>
          <Input
            id="encrypted-sync-passphrase"
            type="password"
            autoComplete="new-password"
            autoFocus
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
          />
          <FieldDescription>
            {`At least ${MIN_PASSPHRASE_LENGTH} characters. You'll enter it once on each device.`}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="encrypted-sync-passphrase-confirm">Confirm passphrase</FieldLabel>
          <Input
            id="encrypted-sync-passphrase-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </Field>
        {error && <FieldError>{error}</FieldError>}
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Spinner data-icon="inline-start" />}
          Turn on sync
        </Button>
      </DialogFooter>
    </form>
  );
};

const RecoveryKeyStep = ({ recoveryKey, onDone }: { recoveryKey: string; onDone: () => void }) => {
  const [saved, setSaved] = useState(false);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Save your recovery key</DialogTitle>
        <DialogDescription>
          If you forget your passphrase, this key is the only way to unlock your synced API keys.
          Store it somewhere safe, like a password manager.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={recoveryKey}
          aria-label="Recovery key"
          className="font-mono"
          onFocus={(event) => event.target.select()}
        />
        <CopyButton
          text={recoveryKey}
          aria-label="Copy recovery key"
          variants={{
            idle: "outline",
            copying: "outline",
            success: "outline",
            error: "destructive",
          }}
        />
      </div>
      <Field orientation="horizontal">
        <Checkbox
          id="encrypted-sync-recovery-saved"
          checked={saved}
          onCheckedChange={(checked) => setSaved(checked === true)}
        />
        <FieldContent>
          <FieldLabel htmlFor="encrypted-sync-recovery-saved">I saved my recovery key</FieldLabel>
        </FieldContent>
      </Field>
      <DialogFooter>
        <Button onClick={onDone} disabled={!saved}>
          Done
        </Button>
      </DialogFooter>
    </>
  );
};

const UnlockStep = ({
  vault,
  onCancel,
  onUnlocked,
  onForgot,
}: {
  vault: EncryptedVault;
  onCancel: () => void;
  onUnlocked: () => void;
  onForgot: () => void;
}) => {
  const [useRecoveryKey, setUseRecoveryKey] = useState(false);
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!secret.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await encryptedSyncManager.unlock(vault, secret, useRecoveryKey);
      onUnlocked();
    } catch (unlockError) {
      setError(errorMessage(unlockError));
      setSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
      <DialogHeader>
        <DialogTitle>Unlock synced API keys</DialogTitle>
        <DialogDescription>
          {useRecoveryKey
            ? "Enter the recovery key you saved when you set up sync."
            : "Enter the sync passphrase you created on your other device."}
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="encrypted-sync-secret">
            {useRecoveryKey ? "Recovery key" : "Passphrase"}
          </FieldLabel>
          <Input
            id="encrypted-sync-secret"
            type={useRecoveryKey ? "text" : "password"}
            autoComplete={useRecoveryKey ? "off" : "current-password"}
            autoFocus
            className={useRecoveryKey ? "font-mono" : undefined}
            placeholder={useRecoveryKey ? "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" : undefined}
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
          />
          {error && <FieldError>{error}</FieldError>}
        </Field>
        <div className="flex flex-wrap gap-x-4">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="px-0"
            onClick={() => {
              setUseRecoveryKey((value) => !value);
              setSecret("");
              setError(null);
            }}
          >
            {useRecoveryKey ? "Use passphrase instead" : "Use recovery key instead"}
          </Button>
          <Button type="button" variant="link" size="sm" className="px-0" onClick={onForgot}>
            Lost both?
          </Button>
        </div>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || !secret.trim()}>
          {submitting && <Spinner data-icon="inline-start" />}
          Unlock
        </Button>
      </DialogFooter>
    </form>
  );
};

const ResetStep = ({
  vault,
  onBack,
  onReset,
}: {
  vault: EncryptedVault;
  onBack: () => void;
  onReset: () => void;
}) => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleReset = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await encryptedSyncManager.resetVault(vault.vaultId);
      onReset();
    } catch (resetError) {
      setError(errorMessage(resetError));
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Start over?</DialogTitle>
        <DialogDescription>
          This deletes the encrypted API keys stored in your AgentOne account. Keys saved on this
          device and your other devices stay where they are. Your other devices will need the new
          passphrase to keep syncing.
        </DialogDescription>
      </DialogHeader>
      {error && <FieldError>{error}</FieldError>}
      <DialogFooter>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button variant="destructive" onClick={() => void handleReset()} disabled={submitting}>
          {submitting && <Spinner data-icon="inline-start" />}
          Delete and start over
        </Button>
      </DialogFooter>
    </>
  );
};
