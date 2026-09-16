import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";

import { SearchInput } from "@/components/a1/search-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion } from "@/components/ui/native/accordion";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import {
  localProviderIdsAtom,
  localProviderSearchItemsAtom,
} from "@/lib/jotai/local-provider-atoms";

import SettingsTarget from "../settings-target";
import { LocalProviderListItem } from "./providers/provider-list-item";

export default function LocalProvidersSettings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItem, setOpenItem] = useState("");
  const localProviderIds = useAtomValue(localProviderIdsAtom);
  const localProviderSearchItems = useAtomValue(localProviderSearchItemsAtom);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProviderIds = useMemo(() => {
    if (!normalizedQuery) {
      return localProviderIds;
    }

    return localProviderSearchItems
      .filter((provider) => provider.name.toLowerCase().includes(normalizedQuery))
      .map((provider) => provider.id);
  }, [localProviderIds, localProviderSearchItems, normalizedQuery]);

  return (
    <SettingsTarget id="setting-local-providers">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Local Providers</CardTitle>
          <CardDescription>
            Configure built-in local providers that can automatically discover models on startup.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SearchInput
            placeholder="Search local providers..."
            value={searchQuery}
            onChange={(event) => {
              trackSettingsInteraction("providers", "local_search_changed", {
                value_length: event.target.value.length,
              });
              setSearchQuery(event.target.value);
            }}
          />

          {filteredProviderIds.length > 0 ? (
            <Accordion
              type="single"
              collapsible
              className="w-full"
              value={openItem}
              onValueChange={(value) => {
                setOpenItem(typeof value === "string" ? value : (value[0] ?? ""));
              }}
            >
              {filteredProviderIds.map((providerId) => (
                <LocalProviderListItem
                  key={providerId}
                  providerId={providerId}
                  onOpenChange={setOpenItem}
                />
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No local providers found.
            </p>
          )}
        </CardContent>
      </Card>
    </SettingsTarget>
  );
}
