import { useMemo, useState } from "react";

import { SearchInput } from "@/components/a1/search-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion } from "@/components/ui/native/accordion";
import { hasEnvKey, PROVIDER_REGISTRY } from "@/lib/ai/providers/registry";
import { trackSettingsInteraction } from "@/lib/google-analytics";

import SettingsTarget from "../settings-target";
import { BuiltInProviderListItem } from "./providers/provider-list-item";

export default function BuiltInProvidersSettings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItem, setOpenItem] = useState("");
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProviders = useMemo(
    () =>
      PROVIDER_REGISTRY.filter(
        (provider) =>
          provider.id !== "agent-one" && provider.label.toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery],
  );

  return (
    <SettingsTarget id="setting-built-in-providers">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Built-in Providers</CardTitle>
          <CardDescription>
            Enable built-in providers, set keys and headers, and override model metadata when
            needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SearchInput
            placeholder="Search built-in providers..."
            value={searchQuery}
            onChange={(event) => {
              trackSettingsInteraction("providers", "built_in_search_changed", {
                value_length: event.target.value.length,
              });
              setSearchQuery(event.target.value);
            }}
          />

          {filteredProviders.length > 0 ? (
            <Accordion
              type="single"
              collapsible
              className="w-full"
              value={openItem}
              onValueChange={(value) => {
                setOpenItem(typeof value === "string" ? value : (value[0] ?? ""));
              }}
            >
              {filteredProviders.map((provider) => (
                <BuiltInProviderListItem
                  key={provider.id}
                  providerId={provider.id}
                  label={provider.label}
                  hasEnvKey={hasEnvKey(provider.id)}
                  onOpenChange={setOpenItem}
                />
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No built-in providers found.
            </p>
          )}
        </CardContent>
      </Card>
    </SettingsTarget>
  );
}
