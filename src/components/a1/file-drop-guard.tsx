import { useEffect } from "react";

function isFileDrag(event: DragEvent) {
  return event.dataTransfer?.types.includes("Files") ?? false;
}

export function FileDropGuard() {
  useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      if (!isFileDrag(event) || event.defaultPrevented) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
    };

    const handleDrop = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  return null;
}
