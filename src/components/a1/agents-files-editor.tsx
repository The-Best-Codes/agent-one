import { IconPlus, IconX } from "@tabler/icons-react";
import { homeDir, sep } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getLogger } from "@/lib/logger";
import { PROJECT_FOLDER_AGENTS_FILE } from "@/lib/projects";

const logger = getLogger(import.meta.url);

interface AgentsFilesEditorProps {
  files: string[];
  setFiles: (update: (prev: string[]) => string[]) => void;
  folder?: string;
  action?: React.ReactNode;
}

export function AgentsFilesEditor({ files, setFiles, folder, action }: AgentsFilesEditorProps) {
  const [home, setHome] = useState<string>();

  useEffect(() => {
    homeDir()
      .then(setHome)
      .catch((error) => logger.warn("Failed to get home folder", error));
  }, []);

  const addFiles = async () => {
    try {
      const selected = await open({
        directory: false,
        multiple: true,
        defaultPath: folder,
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });
      const paths = typeof selected === "string" ? [selected] : (selected ?? []);
      if (paths.length === 0) return;
      setFiles((prev) => [...prev, ...paths.filter((path) => !prev.includes(path))]);
    } catch (error) {
      logger.error("Failed to choose instruction files", error);
    }
  };

  const getLabel = (entry: string) => {
    if (entry === PROJECT_FOLDER_AGENTS_FILE && folder) return `${folder}${sep()}${entry}`;
    if (home && (entry.startsWith("~/") || entry.startsWith("~\\"))) {
      return `${home}${sep()}${entry.slice(2).replace(/[/\\]/g, sep())}`;
    }
    return entry;
  };

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Files that don't exist are skipped. Later files take priority.
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {action}
          <Button type="button" variant="outline" size="sm" onClick={() => void addFiles()}>
            <IconPlus data-icon="inline-start" />
            Add
          </Button>
        </div>
      </div>
      {files.length > 0 ? (
        <div className="flex flex-col gap-2">
          {files.map((entry) => (
            <div key={entry} className="flex min-w-0 items-center gap-2">
              <p
                className="dark:bg-input/30 flex h-8 min-w-0 flex-1 items-center rounded-lg border px-2.5 text-sm"
                title={getLabel(entry)}
              >
                <span className="truncate">{getLabel(entry)}</span>
              </p>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setFiles((prev) => prev.filter((file) => file !== entry))}
                aria-label="Remove file"
              >
                <IconX />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground flex h-20 items-center justify-center rounded-md border border-dashed p-2 text-sm">
          No instruction files will be used.
        </p>
      )}
    </div>
  );
}
