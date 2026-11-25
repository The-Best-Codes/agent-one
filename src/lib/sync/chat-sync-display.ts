import {
  IconCloudCheck,
  IconCloudDownload,
  IconCloudOff,
  IconCloudUpload,
  IconCloudX,
  type Icon,
} from "@tabler/icons-react";

import type { ChatSyncDevice, ChatSyncInfo, ChatSyncState } from "@/lib/sync/chat-sync-manager";

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function formatSyncTime(timestamp: number): string {
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "just now";
  if (abs < 3600) return relativeTime.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relativeTime.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86_400) return relativeTime.format(Math.round(seconds / 86_400), "day");
  return new Date(timestamp).toLocaleDateString();
}

export const CHAT_SYNC_STATE_LABELS: Record<ChatSyncState, { label: string; icon: Icon }> = {
  synced: { label: "Synced", icon: IconCloudCheck },
  pending: { label: "Waiting to Sync", icon: IconCloudUpload },
  downloading: { label: "Syncing…", icon: IconCloudDownload },
  excluded: { label: "Not Syncing", icon: IconCloudOff },
  project: { label: "Not Syncing", icon: IconCloudOff },
  "too-large": { label: "Too Large to Sync", icon: IconCloudX },
};

function deviceLabel(device: ChatSyncDevice): string {
  return device.isThisDevice ? `${device.name} (this device)` : device.name;
}

export function getChatSyncDetails(info: ChatSyncInfo): string[] {
  const lines: string[] = [];
  if (info.firstDevice) lines.push(`First synced from ${deviceLabel(info.firstDevice)}`);
  if (info.lastDevice) {
    const when = info.lastSyncedAt ? ` · ${formatSyncTime(info.lastSyncedAt)}` : "";
    lines.push(`Last synced from ${deviceLabel(info.lastDevice)}${when}`);
  }
  if (info.state === "project") return ["Chats in projects aren't synced"];
  if (info.state === "too-large") lines.push("This chat is too large to sync");
  if (lines.length === 0 && info.state === "pending") lines.push("Not uploaded yet");
  return lines;
}
