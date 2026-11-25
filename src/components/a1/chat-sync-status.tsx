import { IconAlertCircle, IconCloudX } from "@tabler/icons-react";
import { useAtomValue } from "jotai";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { chatSyncStatusAtom } from "@/lib/jotai/sync-atoms";
import { formatSyncTime } from "@/lib/sync/chat-sync-display";

const count = new Intl.NumberFormat();

export function ChatSyncStatus() {
  const status = useAtomValue(chatSyncStatusAtom);
  if (status.phase === "off") return null;

  const percent =
    status.totalChats > 0 ? Math.round((status.syncedChats / status.totalChats) * 100) : 100;
  const pending = status.pendingUploads + status.pendingDownloads;

  const details: string[] = [];
  if (pending > 0) {
    const parts: string[] = [];
    if (status.pendingUploads > 0) parts.push(`${count.format(status.pendingUploads)} to upload`);
    if (status.pendingDownloads > 0) {
      parts.push(`${count.format(status.pendingDownloads)} to download`);
    }
    details.push(`${status.phase === "syncing" ? "Syncing" : "Waiting"}: ${parts.join(", ")}.`);
  } else if (status.phase === "syncing") {
    details.push("Checking for changes…");
  } else {
    details.push("All chats are synced.");
  }
  if (status.tooLarge > 0) {
    details.push(
      `${count.format(status.tooLarge)} ${status.tooLarge === 1 ? "chat is" : "chats are"} too large to sync.`,
    );
  }
  if (status.lastSyncedAt) details.push(`Last synced ${formatSyncTime(status.lastSyncedAt)}.`);

  return (
    <div className="flex flex-col gap-4">
      {status.phase === "error" && (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>Chat sync failed</AlertTitle>
          <AlertDescription>
            {status.error ?? "Couldn't reach the sync server."} AgentOne will keep retrying.
          </AlertDescription>
        </Alert>
      )}
      {status.phase === "quota" && (
        <Alert>
          <IconCloudX />
          <AlertTitle>Chat sync storage is full</AlertTitle>
          <AlertDescription>
            New changes won't upload until you delete synced chats or upgrade your plan.
          </AlertDescription>
        </Alert>
      )}
      <Field>
        <FieldLabel htmlFor={pending > 0 ? "chat-sync-progress" : undefined}>
          <span>Chats synced</span>
          <span className="text-muted-foreground ml-auto tabular-nums">
            {`${count.format(status.syncedChats)} of ${count.format(status.totalChats)}`}
          </span>
        </FieldLabel>
        {pending > 0 && <Progress id="chat-sync-progress" value={percent} />}
        <FieldDescription>{details.join(" ")}</FieldDescription>
      </Field>
    </div>
  );
}
