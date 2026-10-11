import { IconSearch } from "@tabler/icons-react";
import fuzzysort from "fuzzysort";
import { useMemo, useState } from "react";

import { SearchInput } from "@/components/a1/search-input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { SETTINGS } from "@/lib/settings/definitions";

import { SETTINGS_SECTIONS, type SettingsSearchEntry } from "./settings-schema";

interface SearchTarget {
  id: string;
  label: string;
  description: string;
  terms: string;
  location: string;
  context: string;
  section: string;
  priority: number;
  order: number;
}

const SEARCH_TARGETS: SearchTarget[] = SETTINGS_SECTIONS.flatMap((section) =>
  section.cards.flatMap((card) => {
    const location = card.title ?? section.label;
    const context = card.title ? `${section.label} ${card.title}` : section.label;
    const toTarget = (entry: SettingsSearchEntry, extraTerms: string[] = []) => ({
      id: `setting-${entry.id}`,
      label: entry.label,
      description: entry.description ?? "",
      terms: [...(entry.keywords ?? []), ...extraTerms].join(" "),
      location,
      context,
      section: section.label,
      priority: section.searchPriority ?? 1,
      order: 0,
    });

    const cardTargets = [
      ...(card.id ? [toTarget({ ...card, id: card.id, label: location })] : []),
      ...(card.searchEntries ?? []).map((entry) => toTarget(entry)),
    ];

    const itemTargets = (card.items ?? []).flatMap((item) => {
      const definition = item.key ? SETTINGS[item.key] : undefined;
      const label = item.label ?? definition?.label;
      const entries = (item.searchEntries ?? []).map((entry) => toTarget(entry));

      if (!label) return entries;

      return [
        toTarget({ ...item, label, description: item.description ?? definition?.description }, [
          ...(definition?.keywords ?? []),
          ...(definition && "options" in definition ? Object.values(definition.options) : []),
        ]),
        ...entries,
      ];
    });

    return [...cardTargets, ...itemTargets];
  }),
).map((target, order) => ({ ...target, order }));

function searchSettings(query: string) {
  const results = fuzzysort
    .go(query, SEARCH_TARGETS, {
      keys: ["label", "terms", "description", "context"],
      threshold: 0.45,
      scoreFn: ([label, terms, description, context]) =>
        Math.max(label.score, terms.score * 0.9, description.score * 0.75, context.score * 0.6),
    })
    .map((result) => ({ target: result.obj, score: result.score * result.obj.priority }))
    .sort((a, b) => b.score - a.score || a.target.order - b.target.order)
    .map(({ target }) => target)
    .filter((target) => document.getElementById(target.id))
    .slice(0, 30);

  const groups = new Map<string, SearchTarget[]>();
  for (const target of results) {
    groups.set(target.section, [...(groups.get(target.section) ?? []), target]);
  }

  return groups;
}

export function SettingsSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick} className="w-full justify-start">
      <IconSearch data-icon="inline-start" />
      Search settings
    </Button>
  );
}

interface SettingsSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
}

export function SettingsSearch({ open, onOpenChange, onSelect }: SettingsSearchProps) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const results = useMemo(
    () => (open && trimmedQuery ? searchSettings(trimmedQuery) : null),
    [open, trimmedQuery],
  );

  useKeyboardShortcut("searchSettings", () => onOpenChange(true));

  const select = (id: string) => {
    onOpenChange(false);
    setQuery("");
    onSelect(id);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search settings"
      description="Search for a setting to jump to it."
      className="sm:max-w-lg"
    >
      <Command shouldFilter={false}>
        <div className="p-1 pb-0">
          <SearchInput
            placeholder="Search settings..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
        <CommandList>
          <CommandEmpty>{`No results for "${trimmedQuery}"`}</CommandEmpty>
          {results ? (
            [...results].map(([section, targets]) => (
              <CommandGroup key={section} heading={section}>
                {targets.map((target) => (
                  <CommandItem
                    key={`${target.id}:${target.label}`}
                    value={`${target.id}:${target.label}`}
                    onSelect={() => select(target.id)}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{target.label}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {target.description || target.location}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          ) : (
            <CommandGroup heading="Sections">
              {SETTINGS_SECTIONS.map((section) => (
                <CommandItem
                  key={section.id}
                  value={section.id}
                  onSelect={() => select(`section-${section.id}`)}
                >
                  {section.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
