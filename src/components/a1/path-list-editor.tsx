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
import { PROJECT_FOLDER_SKILLS_FOLDERS } from "@/lib/skills";

const logger = getLogger(import.meta.url);

const TEXT = {
  files: {
    hint: "Files that don't exist are skipped. Later files take priority.",
    empty: "No instruction files will be used.",
    removeTitle: "Remove this file?",
    removeDescription: "AgentOne will stop following it. The file itself won't be deleted.",
  },
  folders: {
    hint: "Each skill is a folder with a SKILL.md file. Later folders take priority.",
    empty: "No skill folders will be used.",
    removeTitle: "Remove this folder?",
    removeDescription:
      "AgentOne will stop using the skills in it. The folder itself won't be deleted.",
  },
};

interface PathListEditorProps {
  files: string[];
  setFiles: (update: (prev: string[]) => string[]) => void;
  folder?: string;
  action?: React.ReactNode;
  directory?: boolean;
}

export function PathListEditor({
  files,
  setFiles,
  folder,
  action,
  directory = false,
}: PathListEditorProps) {
  const text = directory ? TEXT.folders : TEXT.files;
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
        directory,
        multiple: true,
        defaultPath: folder,
        filters: directory ? undefined : [{ name: "Markdown", extensions: ["md"] }],
      });
      const paths = typeof selected === "string" ? [selected] : (selected ?? []);
      if (paths.length === 0) return;
      setFiles((prev) => [...prev, ...paths.filter((path) => !prev.includes(path))]);
    } catch (error) {
      logger.error("Failed to choose paths", error);
    }
  };

  const getLabel = (entry: string) => {
    if (folder && [PROJECT_FOLDER_AGENTS_FILE, ...PROJECT_FOLDER_SKILLS_FOLDERS].includes(entry)) {
      return `${folder}${sep()}${entry}`;
    }
    if (home && (entry.startsWith("~/") || entry.startsWith("~\\"))) {
      return `${home}${sep()}${entry.slice(2).replace(/[/\\]/g, sep())}`;
    }
    return entry;
  };

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="text-muted-foreground text-xs">{text.hint}</div>
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
              <div
                className="dark:bg-input/30 flex h-8 min-w-0 flex-1 items-center rounded-lg border px-2.5 text-sm"
                title={getLabel(entry)}
              >
                <span className="truncate text-left" dir="rtl">
                  <bdi dir="ltr">{getLabel(entry)}</bdi>
                </span>
              </div>
              <Popover
                open={removingFile === entry}
                onOpenChange={(isOpen) => setRemovingFile(isOpen ? entry : null)}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    aria-label={text.removeTitle}
                  >
                    <IconX />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end">
                  <PopoverHeader>
                    <PopoverTitle>{text.removeTitle}</PopoverTitle>
                    <PopoverDescription>{text.removeDescription}</PopoverDescription>
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
          {text.empty}
        </p>
      )}
    </div>
  );
}
