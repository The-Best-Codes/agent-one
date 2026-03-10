import { PlusIcon, RotateCcwIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DraftEntry = [string, string];

function toDraft(record: Record<string, string>): DraftEntry[] {
  return Object.entries(record);
}

function toRecord(draft: DraftEntry[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of draft) {
    result[key] = value;
  }
  return result;
}

function getDuplicateKeys(draft: DraftEntry[]): Set<number> {
  const seen = new Map<string, number>();
  const dupes = new Set<number>();
  for (let i = 0; i < draft.length; i++) {
    const key = draft[i][0].trim();
    if (!key) continue;
    if (seen.has(key)) {
      dupes.add(seen.get(key)!);
      dupes.add(i);
    } else {
      seen.set(key, i);
    }
  }
  return dupes;
}

function hasEmptyKeys(draft: DraftEntry[]): boolean {
  return draft.some(([key]) => !key.trim());
}

export function HttpHeadersEditor({
  id,
  headers,
  onChange,
  labelClassName,
}: {
  id: string;
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
  labelClassName?: string;
}) {
  const [syncedHeaders, setSyncedHeaders] = useState(headers);
  const [draft, setDraft] = useState<DraftEntry[]>(() => toDraft(headers));

  if (syncedHeaders !== headers) {
    setSyncedHeaders(headers);
    setDraft(toDraft(headers));
  }

  const duplicateKeys = useMemo(() => getDuplicateKeys(draft), [draft]);
  const emptyKeys = hasEmptyKeys(draft);

  const hasChanges = JSON.stringify(toRecord(draft)) !== JSON.stringify(headers);
  const canSave = hasChanges && !emptyKeys && duplicateKeys.size === 0;

  const addEntry = () => {
    setDraft((prev) => [...prev, ["", ""]]);
  };

  const updateKey = (index: number, newKey: string) => {
    setDraft((prev) => prev.map((entry, i) => (i === index ? [newKey, entry[1]] : entry)));
  };

  const updateValue = (index: number, newValue: string) => {
    setDraft((prev) => prev.map((entry, i) => (i === index ? [entry[0], newValue] : entry)));
  };

  const removeEntry = (index: number) => {
    const next = draft.filter((_, i) => i !== index);
    setDraft(next);
    const nextDupes = getDuplicateKeys(next);
    const nextEmpty = next.some(([key]) => !key.trim());
    if (!nextEmpty && nextDupes.size === 0) {
      onChange(toRecord(next));
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    onChange(toRecord(draft));
  };

  const handleRevert = () => {
    setDraft(toDraft(headers));
  };

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <Label className={labelClassName || "text-xs"}>HTTP Headers</Label>
        <div className="flex gap-1.5">
          {hasChanges && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!canSave}
                title="Save changes"
              >
                <SaveIcon data-icon="inline-start" />
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRevert}
                title="Revert changes"
              >
                <RotateCcwIcon data-icon="inline-start" />
                Revert
              </Button>
            </>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addEntry}>
            <PlusIcon data-icon="inline-start" />
            Add
          </Button>
        </div>
      </div>
      {draft.length > 0 ? (
        <div className="flex flex-col gap-2">
          {draft.map(([key, value], idx) => {
            const isDupe = duplicateKeys.has(idx);
            const isEmpty = !key.trim();
            const hasError = isDupe || isEmpty;
            return (
              <div key={`${id}-header-${idx}`}>
                <div className="flex gap-2">
                  <Input
                    placeholder="Header name"
                    value={key}
                    onChange={(e) => updateKey(idx, e.target.value)}
                    aria-invalid={hasError}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={value}
                    onChange={(e) => updateValue(idx, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeEntry(idx)}
                  >
                    <Trash2Icon data-icon="inline-start" />
                  </Button>
                </div>
                {isDupe && (
                  <p className="text-destructive mt-1 ml-0.5 text-xs">Duplicate header name</p>
                )}
                {isEmpty && !isDupe && (
                  <p className="text-destructive mt-1 ml-0.5 text-xs">
                    Header name cannot be empty
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground flex h-9 flex-col items-center justify-center rounded-md border border-dashed p-2 text-sm">
          No headers configured.
        </p>
      )}
    </div>
  );
}
