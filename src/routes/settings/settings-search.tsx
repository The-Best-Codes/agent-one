import { Command as CommandPrimitive } from "cmdk";
import fuzzysort from "fuzzysort";
import { useMemo, useRef, useState } from "react";

import { SearchInput } from "@/components/a1/search-input";
import { CommandEmpty, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { SETTINGS } from "@/lib/settings/definitions";

import { SETTINGS_SECTIONS, type SettingsSearchEntry } from "./settings-schema";

interface SearchTarget {
  id: string;
  label: string;
  description: string;
  terms: string;
  location: string;
}

function toTarget(entry: SettingsSearchEntry, location: string, extraTerms: string[] = []) {
  return {
    id: entry.id,
    label: entry.label,
    description: entry.description ?? "",
    terms: [...(entry.keywords ?? []), ...extraTerms].join(" "),
    location,
  };
}

const SEARCH_TARGETS: SearchTarget[] = SETTINGS_SECTIONS.flatMap((section) =>
  section.cards.flatMap((card) => {
    const location = `${section.label} › ${card.title}`;
    const cardTarget = card.id
      ? [toTarget({ ...card, id: card.id, label: card.title }, section.label)]
      : [];

    const itemTargets = (card.items ?? []).flatMap((item) => {
      const definition = item.key ? SETTINGS[item.key] : undefined;
      const label = item.label ?? definition?.label;
      const options =
        definition && "options" in definition ? Object.values(definition.options) : [];
      const entries = item.searchEntries?.map((entry) => toTarget(entry, location)) ?? [];

      return label
        ? [
            toTarget(
              { ...item, label, description: item.description ?? definition?.description },
              location,
              options,
            ),
            ...entries,
          ]
        : entries;
    });

    return [...cardTarget, ...itemTargets];
  }),
);

function searchSettings(query: string) {
  return fuzzysort
    .go(query, SEARCH_TARGETS, {
      keys: ["label", "terms", "description", "location"],
      threshold: 0.45,
      limit: 20,
      scoreFn: ([label, terms, description, location]) =>
        Math.max(label.score, terms.score * 0.9, description.score * 0.75, location.score * 0.6),
    })
    .map((result) => result.obj)
    .filter((target) => document.getElementById(`setting-${target.id}`));
}

export function SettingsSearch({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => (query.trim() ? searchSettings(query.trim()) : []), [query]);

  return (
    <CommandPrimitive shouldFilter={false} label="Search settings">
      <Popover open={open && query.trim() !== ""} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div ref={anchorRef}>
            <SearchInput
              placeholder="Search settings..."
              aria-label="Search settings"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-80 p-1"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
          }}
        >
          <CommandList>
            <CommandEmpty>No settings found.</CommandEmpty>
            {results.map((result) => (
              <CommandItem
                key={result.id}
                value={result.id}
                onSelect={() => {
                  onSelect(result.id);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate">{result.label}</span>
                  <span className="text-muted-foreground truncate text-xs">{result.location}</span>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </PopoverContent>
      </Popover>
    </CommandPrimitive>
  );
}
