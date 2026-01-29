import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const entries = Object.entries(headers);

  const addHeader = () => {
    onChange({ ...headers, "": "" });
  };

  const updateHeader = (newKey: string, newValue: string, index: number) => {
    const newHeaders: Record<string, string> = {};
    let i = 0;
    for (const [key, value] of Object.entries(headers)) {
      if (i === index) {
        if (newKey.trim()) {
          newHeaders[newKey] = newValue;
        }
      } else {
        newHeaders[key] = value;
      }
      i++;
    }
    onChange(newHeaders);
  };

  const removeHeader = (keyToRemove: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[keyToRemove];
    onChange(newHeaders);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <Label className={labelClassName || "text-xs"}>HTTP Headers</Label>
        <Button type="button" variant="outline" size="sm" onClick={addHeader}>
          <PlusIcon className="size-4" />
          Add
        </Button>
      </div>
      {entries.length > 0 ? (
        <div className="flex flex-col gap-2">
          {entries.map(([key, value], idx) => (
            <div key={`${id}-header-${idx}`} className="flex gap-2">
              <Input
                placeholder="Header name"
                value={key}
                onChange={(e) => updateHeader(e.target.value, value, idx)}
                className="flex-1"
              />
              <Input
                placeholder="Value"
                value={value}
                onChange={(e) => updateHeader(key, e.target.value, idx)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removeHeader(key)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground flex h-9 flex-col items-center justify-center rounded-md border border-dashed p-2 text-sm">
          No headers configured.
        </p>
      )}
    </div>
  );
}
