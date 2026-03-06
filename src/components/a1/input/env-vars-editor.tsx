import { EyeIcon, EyeOffIcon, PlusIcon, RotateCcwIcon, SaveIcon, Trash2Icon } from "lucide-react";
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

export function EnvVarsEditor({
  id,
  env,
  onChange,
  labelClassName,
}: {
  id: string;
  env: Record<string, string>;
  onChange: (env: Record<string, string>) => void;
  labelClassName?: string;
}) {
  const [syncedEnv, setSyncedEnv] = useState(env);
  const [draft, setDraft] = useState<DraftEntry[]>(() => toDraft(env));
  const [visibleValues, setVisibleValues] = useState<Set<number>>(new Set());

  if (syncedEnv !== env) {
    setSyncedEnv(env);
    setDraft(toDraft(env));
    setVisibleValues(new Set());
  }

  const duplicateKeys = useMemo(() => getDuplicateKeys(draft), [draft]);
  const emptyKeys = hasEmptyKeys(draft);

  const hasChanges = JSON.stringify(toRecord(draft)) !== JSON.stringify(env);
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
    setVisibleValues((prev) => {
      const updated = new Set<number>();
      for (const v of prev) {
        if (v < index) updated.add(v);
        else if (v > index) updated.add(v - 1);
      }
      return updated;
    });
    const nextDupes = getDuplicateKeys(next);
    const nextEmpty = next.some(([key]) => !key.trim());
    if (!nextEmpty && nextDupes.size === 0) {
      onChange(toRecord(next));
    }
  };

  const toggleVisibility = (index: number) => {
    setVisibleValues((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!canSave) return;
    onChange(toRecord(draft));
  };

  const handleRevert = () => {
    setDraft(toDraft(env));
    setVisibleValues(new Set());
  };

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <Label className={labelClassName || "text-xs"}>Environment Variables</Label>
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
                <SaveIcon className="size-4" />
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRevert}
                title="Revert changes"
              >
                <RotateCcwIcon className="size-4" />
                Revert
              </Button>
            </>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addEntry}>
            <PlusIcon className="size-4" />
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
            const isVisible = visibleValues.has(idx);
            return (
              <div key={`${id}-env-${idx}`}>
                <div className="flex gap-2">
                  <Input
                    placeholder="Variable name"
                    value={key}
                    onChange={(e) => updateKey(idx, e.target.value)}
                    aria-invalid={hasError}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    type={isVisible ? "text" : "password"}
                    autoComplete="off"
                    value={value}
                    onChange={(e) => updateValue(idx, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => toggleVisibility(idx)}
                    title={isVisible ? "Hide value" : "Show value"}
                  >
                    {isVisible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeEntry(idx)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
                {isDupe && (
                  <p className="text-destructive mt-1 ml-0.5 text-xs">Duplicate variable name</p>
                )}
                {isEmpty && !isDupe && (
                  <p className="text-destructive mt-1 ml-0.5 text-xs">
                    Variable name cannot be empty
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground flex h-9 flex-col items-center justify-center rounded-md border border-dashed p-2 text-sm">
          No environment variables configured.
        </p>
      )}
    </div>
  );
}
