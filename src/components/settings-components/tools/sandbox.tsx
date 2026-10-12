import { IconCircleCheck, IconInfoCircle, IconRefresh } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";

import { SettingsRow } from "@/components/settings-components/setting-controls";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { sandboxEnabledAtom } from "@/lib/jotai/sandbox-atoms";
import { getSandboxStatus, OPENSHELL_INSTALL_URL, type SandboxStatus } from "@/lib/openshell";

const STATUS_MESSAGES: Record<
  Exclude<SandboxStatus, "ready">,
  { title: string; description: string; canRetry: boolean }
> = {
  unsupported: {
    title: "Not available on this device",
    description: "The sandbox currently works on Linux and on Macs with Apple silicon.",
    canRetry: false,
  },
  "not-installed": {
    title: "OpenShell isn't installed",
    description:
      "The sandbox is powered by NVIDIA OpenShell, which also needs Docker or Podman. Install it, then check again.",
    canRetry: true,
  },
  "not-running": {
    title: "OpenShell isn't running",
    description:
      "OpenShell is installed, but AgentOne couldn't connect to it. Start it, then check again.",
    canRetry: true,
  },
};

export function SandboxControl() {
  const [enabled, setEnabled] = useAtom(sandboxEnabledAtom);
  const [status, setStatus] = useState<SandboxStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getSandboxStatus().then((nextStatus) => {
      if (!cancelled) setStatus(nextStatus);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const checkAgain = () => {
    setStatus(null);
    void getSandboxStatus().then(setStatus);
  };

  const message = status && status !== "ready" ? STATUS_MESSAGES[status] : null;

  return (
    <div className="flex flex-col gap-3">
      <SettingsRow
        label="Run tools in a sandbox"
        description="Commands and file changes made by the AI happen in a separate, isolated workspace instead of on your computer. The sandbox can't see your files or use the internet."
        htmlFor="sandbox-enabled"
        layout="row"
      >
        <Switch
          id="sandbox-enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
          disabled={!enabled && status !== "ready"}
        />
      </SettingsRow>

      {status === null && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Spinner />
          Checking for OpenShell...
        </p>
      )}

      {status === "ready" && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <IconCircleCheck className="size-4" />
          OpenShell is ready.
        </p>
      )}

      {message && (
        <Alert>
          <IconInfoCircle />
          <AlertTitle>{message.title}</AlertTitle>
          <AlertDescription>
            <p>
              {message.description}{" "}
              {status === "not-installed" && (
                <a href={OPENSHELL_INSTALL_URL} target="_blank" rel="noopener noreferrer">
                  How to install OpenShell
                </a>
              )}
            </p>
            {enabled && (
              <p>While the sandbox is on, the AI can't run commands or work with files.</p>
            )}
          </AlertDescription>
          {message.canRetry && (
            <AlertAction>
              <Button variant="outline" size="sm" onClick={checkAgain}>
                <IconRefresh data-icon="inline-start" />
                Check again
              </Button>
            </AlertAction>
          )}
        </Alert>
      )}
    </div>
  );
}
