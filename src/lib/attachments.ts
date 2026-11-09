import { join, tempDir } from "@tauri-apps/api/path";
import { mkdir, writeFile } from "@tauri-apps/plugin-fs";
import { generateId } from "ai";
import { atom } from "jotai";

export const FILE_KINDS = ["image", "video", "audio", "pdf", "other"] as const;

export type FileKind = (typeof FILE_KINDS)[number];

export const attachmentPreviewAtom = atom<string | null>(null);

const MEDIA_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  heic: "image/heic",
  pdf: "application/pdf",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  flac: "audio/flac",
  aac: "audio/aac",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
};

export function getMediaType(name: string): string | undefined {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? MEDIA_TYPES[name.slice(dot + 1).toLowerCase()] : undefined;
}

export function getFileKind(mediaType: string | undefined): FileKind {
  if (!mediaType) return "other";
  if (mediaType === "application/pdf") return "pdf";
  const [type] = mediaType.split("/");
  return type === "image" || type === "video" || type === "audio" ? type : "other";
}

export function isTextContent(bytes: Uint8Array): boolean {
  return !bytes.subarray(0, 8000).includes(0);
}

export async function createAttachmentPath(file: File): Promise<string> {
  const name = file.name.replace(/[<>:"/\\|?*\p{Cc}]/gu, "_").trim() || "attachment";
  const dir = await join(await tempDir(), "agent-one", "attachments", generateId());
  await mkdir(dir, { recursive: true });
  return join(dir, name);
}

export async function writeAttachmentFile(path: string, file: File) {
  await writeFile(path, new Uint8Array(await file.arrayBuffer()));
}
