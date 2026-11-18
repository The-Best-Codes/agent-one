import { getCurrentWebview } from "@tauri-apps/api/webview";
import { platform } from "@tauri-apps/plugin-os";
import { useEffect } from "react";

const IS_LINUX = platform() === "linux";

export function useNativeFileDrop(
  onDraggingChange: (isDragging: boolean) => void,
  onDrop: (paths: string[]) => void,
) {
  useEffect(() => {
    if (!IS_LINUX) return;
    const unlisten = getCurrentWebview().onDragDropEvent(({ payload }) => {
      if (payload.type === "over") return;
      onDraggingChange(payload.type === "enter");
      if (payload.type === "drop" && payload.paths.length > 0) onDrop(payload.paths);
    });
    return () => void unlisten.then((fn) => fn());
  }, [onDraggingChange, onDrop]);
}
