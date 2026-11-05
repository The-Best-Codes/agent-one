import { IconPlus, IconX } from "@tabler/icons-react";
import { homeDir, sep } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [removingFile, setRemovingFile] = useState<string | null>(null);

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
              <Popover
                open={removingFile === entry}
                onOpenChange={(isOpen) => setRemovingFile(isOpen ? entry : null)}
              >
                <PopoverTrigger asChild>
                  <Button type="button" variant="destructive" size="icon" aria-label="Remove file">
                    <IconX />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end">
                  <PopoverHeader>
                    <PopoverTitle>Remove this file?</PopoverTitle>
                    <PopoverDescription>
                      AgentOne will stop following it. The file itself won't be deleted.
                    </PopoverDescription>
                  </PopoverHeader>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setRemovingFile(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setFiles((prev) => prev.filter((file) => file !== entry));
                        setRemovingFile(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
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
