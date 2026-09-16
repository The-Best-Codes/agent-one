import { IconPlus, IconX } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { memoryAtom } from "@/lib/jotai/settings-atoms";
import { MAX_MEMORY_ENTRIES, MAX_MEMORY_ENTRY_CHARS } from "@/lib/memory";

export default function MemorySettings() {
  const [memory, setMemory] = useAtom(memoryAtom);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  const addMemoryEntry = () => {
    if (memory.length >= MAX_MEMORY_ENTRIES) return;
    if (memory.length > 0 && memory[memory.length - 1] === "") return;

    trackSettingsInteraction("profile", "memory_entry_added", {
      entry_count: memory.length + 1,
    });
    setMemory((prev) => [...prev, ""]);
  };

  const updateMemoryEntry = (index: number, value: string) => {
    trackSettingsInteraction("profile", "memory_changed", {
      value_length: value.length,
      entry_index: index,
    });

    setMemory((prev) => prev.map((entry, entryIndex) => (entryIndex === index ? value : entry)));
  };

  const removeMemoryEntry = (index: number) => {
    trackSettingsInteraction("profile", "memory_entry_removed", {
      entry_index: index,
    });

    setMemory((prev) => prev.filter((_, entryIndex) => entryIndex !== index));
  };

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Keep each item short and specific so AgentOne can reuse it well.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addMemoryEntry}
          disabled={
            memory.length >= MAX_MEMORY_ENTRIES ||
            (memory.length > 0 && memory[memory.length - 1] === "")
          }
        >
          <IconPlus data-icon="inline-start" />
          Add
        </Button>
      </div>

      {memory.length > 0 ? (
        <div className="flex flex-col gap-2">
          {memory.map((entry, index) => (
            <div key={`memory-entry-${index}`} className="flex items-center gap-2">
              <Input
                id={index === 0 ? "memory" : undefined}
                value={entry}
                onChange={(event) => updateMemoryEntry(index, event.target.value)}
                placeholder="e.g. I prefer concise technical answers"
                maxLength={MAX_MEMORY_ENTRY_CHARS}
                className="flex-1"
              />

              {entry ? (
                <Popover
                  open={removingIndex === index}
                  onOpenChange={(open) => setRemovingIndex(open ? index : null)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      aria-label="Remove memory entry"
                    >
                      <IconX />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end">
                    <PopoverHeader>
                      <PopoverTitle>Delete this memory?</PopoverTitle>
                      <PopoverDescription>This cannot be undone.</PopoverDescription>
                    </PopoverHeader>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setRemovingIndex(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          removeMemoryEntry(index);
                          setRemovingIndex(null);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeMemoryEntry(index)}
                  aria-label="Remove memory entry"
                >
                  <IconX />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground flex h-20 items-center justify-center rounded-md border border-dashed p-2 text-sm">
          Nothing saved yet.
        </p>
      )}
    </div>
  );
}
