import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function HttpHeadersEditor({
  serverId,
  headers,
  onChange,
}: {
  serverId: string;
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
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
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">HTTP Headers</Label>
        <Button type="button" variant="outline" size="sm" onClick={addHeader}>
          <PlusIcon className="size-4" />
          Add
        </Button>
      </div>
      {entries.length > 0 ? (
        <div className="flex flex-col gap-2">
          {entries.map(([key, value], idx) => (
            <div key={`${serverId}-header-${idx}`} className="flex gap-2">
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
                variant="ghost"
                size="icon"
                onClick={() => removeHeader(key)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">No headers configured.</p>
      )}
    </div>
  );
}
