import { IconPlugConnected, IconRefresh, IconRestore } from "@tabler/icons-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { SecretInput } from "@/components/a1/input/secret-input";
import { SearchInput } from "@/components/a1/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Accordion } from "@/components/ui/native/accordion";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  modelDirectoryStatusAtom,
  resetModelDirectory,
  updateModelDirectory,
} from "@/lib/ai/models/model-directory";
import { hasEnvKey, PROVIDER_REGISTRY } from "@/lib/ai/providers/registry";
import { TTS_PROVIDER_OPTIONS, getSelectedTtsModel, normalizeTtsSettings } from "@/lib/ai/tts";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { apiKeyAtomFamily } from "@/lib/jotai/api-key-atoms";
import {
  deleteCustomProviderApiKeyAtom,
  setCustomProviderApiKeyAtom,
} from "@/lib/jotai/custom-provider-api-key-atoms";
import {
  addCustomProviderAtom,
  customProviderIdsAtom,
  customProviderSearchItemsAtom,
  deleteCustomProviderAtom,
  type NewCustomProviderData,
} from "@/lib/jotai/custom-provider-atoms";
import {
  localProviderIdsAtom,
  localProviderSearchItemsAtom,
} from "@/lib/jotai/local-provider-atoms";
import { ttsSettingsAtom } from "@/lib/jotai/settings-atoms";

import SettingsTarget from "../../settings-target";
import { AddProviderDropdown } from "./add-provider-dropdown";
import {
  BuiltInProviderListItem,
  CustomProviderListItem,
  LocalProviderListItem,
} from "./provider-list-item";

function formatModelDirectoryTimestamp(value: number): string {
  return value ? new Date(value).toLocaleString() : "Never";
}

export function ProvidersList() {
  const [builtInSearchQuery, setBuiltInSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [customSearchQuery, setCustomSearchQuery] = useState("");
  const [openBuiltInItem, setOpenBuiltInItem] = useState("");
  const [openLocalItem, setOpenLocalItem] = useState("");
  const [openCustomItem, setOpenCustomItem] = useState("");
  const [isUpdatingModelDirectory, setIsUpdatingModelDirectory] = useState(false);

  const handleBuiltInOpenChange = useCallback((value: string | string[]) => {
    setOpenBuiltInItem(typeof value === "string" ? value : (value[0] ?? ""));
  }, []);
  const handleLocalOpenChange = useCallback((value: string | string[]) => {
    setOpenLocalItem(typeof value === "string" ? value : (value[0] ?? ""));
  }, []);
  const handleCustomOpenChange = useCallback((value: string | string[]) => {
    setOpenCustomItem(typeof value === "string" ? value : (value[0] ?? ""));
  }, []);

  const localProviderIds = useAtomValue(localProviderIdsAtom);
  const modelDirectoryStatus = useAtomValue(modelDirectoryStatusAtom);
  const rawTtsSettings = useAtomValue(ttsSettingsAtom);
  const localProviderSearchItems = useAtomValue(localProviderSearchItemsAtom);
  const customProviderIds = useAtomValue(customProviderIdsAtom);
  const customProviderSearchItems = useAtomValue(customProviderSearchItemsAtom);
  const addCustomProvider = useSetAtom(addCustomProviderAtom);
  const deleteCustomProvider = useSetAtom(deleteCustomProviderAtom);
  const setCustomProviderApiKey = useSetAtom(setCustomProviderApiKeyAtom);
  const deleteCustomProviderApiKey = useSetAtom(deleteCustomProviderApiKeyAtom);
  const setTtsSettings = useSetAtom(ttsSettingsAtom);
  const setOpenAiTtsApiKey = useSetAtom(apiKeyAtomFamily("tts-openai"));
  const setElevenLabsTtsApiKey = useSetAtom(apiKeyAtomFamily("tts-elevenlabs"));
  const setLmntTtsApiKey = useSetAtom(apiKeyAtomFamily("tts-lmnt"));
  const setHumeTtsApiKey = useSetAtom(apiKeyAtomFamily("tts-hume"));
  const ttsSettings = normalizeTtsSettings(rawTtsSettings);
  const selectedTtsProvider = TTS_PROVIDER_OPTIONS.find(
    (provider) => provider.id === ttsSettings.provider,
  );
  const selectedTtsModel = getSelectedTtsModel(ttsSettings);
  const openAiTtsApiKey = useAtomValue(apiKeyAtomFamily("tts-openai"));
  const elevenLabsTtsApiKey = useAtomValue(apiKeyAtomFamily("tts-elevenlabs"));
  const lmntTtsApiKey = useAtomValue(apiKeyAtomFamily("tts-lmnt"));
  const humeTtsApiKey = useAtomValue(apiKeyAtomFamily("tts-hume"));

  const updateTtsSettings = (updates: Partial<typeof ttsSettings>) => {
    setTtsSettings({
      ...ttsSettings,
      ...updates,
    });
  };

  const normalizedBuiltInQuery = builtInSearchQuery.trim().toLowerCase();
  const normalizedLocalQuery = localSearchQuery.trim().toLowerCase();
  const normalizedCustomQuery = customSearchQuery.trim().toLowerCase();

  const filteredBuiltInProviders = useMemo(
    () =>
      PROVIDER_REGISTRY.filter(
        (provider) =>
          provider.id !== "agent-one" &&
          provider.label.toLowerCase().includes(normalizedBuiltInQuery),
      ),
    [normalizedBuiltInQuery],
  );

  const filteredCustomProviderIds = useMemo(() => {
    if (!normalizedCustomQuery) {
      return customProviderIds;
    }

    return customProviderSearchItems
      .filter((provider) => provider.name.toLowerCase().includes(normalizedCustomQuery))
      .map((provider) => provider.id);
  }, [customProviderIds, customProviderSearchItems, normalizedCustomQuery]);

  const filteredLocalProviderIds = useMemo(() => {
    if (!normalizedLocalQuery) {
      return localProviderIds;
    }

    return localProviderSearchItems
      .filter((provider) => provider.name.toLowerCase().includes(normalizedLocalQuery))
      .map((provider) => provider.id);
  }, [localProviderIds, localProviderSearchItems, normalizedLocalQuery]);

  const handleAddProvider = (data: NewCustomProviderData, apiKey: string) => {
    trackSettingsInteraction("providers", "custom_provider_added", {
      has_api_key: Boolean(apiKey.trim()),
      model_count: data.models.length,
    });
    const providerId = addCustomProvider(data);

    if (apiKey) {
      void setCustomProviderApiKey(providerId, apiKey);
    }
  };

  const handleDeleteProvider = (providerId: string) => {
    trackSettingsInteraction("providers", "custom_provider_deleted");
    deleteCustomProvider(providerId);
    void deleteCustomProviderApiKey(providerId);
  };

  const handleUpdateModelDirectory = async () => {
    setIsUpdatingModelDirectory(true);
    trackSettingsInteraction("providers", "model_directory_update");
    const result = await updateModelDirectory();
    setIsUpdatingModelDirectory(false);

    if (!result.ok) {
      toast.error("Failed to update model list", { description: result.error });
      return;
    }

    toast.success("Model list updated", {
      description: `${result.providerCount ?? 0} providers, ${result.modelCount ?? 0} models loaded.`,
    });
  };

  const handleResetModelDirectory = async () => {
    trackSettingsInteraction("providers", "model_directory_reset");
    await resetModelDirectory();
    toast.success("Model list reset to bundled version");
  };

  return (
    <div className="flex flex-col gap-4">
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
              value={builtInSearchQuery}
              onChange={(event) => {
                trackSettingsInteraction("providers", "built_in_search_changed", {
                  value_length: event.target.value.length,
                });
                setBuiltInSearchQuery(event.target.value);
              }}
            />

            {filteredBuiltInProviders.length > 0 ? (
              <Accordion
                type="single"
                collapsible
                className="w-full"
                value={openBuiltInItem}
                onValueChange={handleBuiltInOpenChange}
              >
                {filteredBuiltInProviders.map((provider) => (
                  <BuiltInProviderListItem
                    key={provider.id}
                    providerId={provider.id}
                    label={provider.label}
                    hasEnvKey={hasEnvKey(provider.id)}
                    onOpenChange={setOpenBuiltInItem}
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
              value={localSearchQuery}
              onChange={(event) => {
                trackSettingsInteraction("providers", "local_search_changed", {
                  value_length: event.target.value.length,
                });
                setLocalSearchQuery(event.target.value);
              }}
            />

            {filteredLocalProviderIds.length > 0 ? (
              <Accordion
                type="single"
                collapsible
                className="w-full"
                value={openLocalItem}
                onValueChange={handleLocalOpenChange}
              >
                {filteredLocalProviderIds.map((providerId) => (
                  <LocalProviderListItem
                    key={providerId}
                    providerId={providerId}
                    onOpenChange={setOpenLocalItem}
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

      <SettingsTarget id="setting-custom-providers">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Custom Providers</CardTitle>
            <CardDescription>
              Add OpenAI-compatible providers and configure exactly which models they expose.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-2">
              <SearchInput
                placeholder="Search custom providers..."
                value={customSearchQuery}
                onChange={(event) => {
                  trackSettingsInteraction("providers", "custom_search_changed", {
                    value_length: event.target.value.length,
                  });
                  setCustomSearchQuery(event.target.value);
                }}
                containerClassName="flex-1"
              />
              <AddProviderDropdown onAddProvider={handleAddProvider} />
            </div>

            {customProviderIds.length === 0 ? (
              <Empty className="bg-muted/20 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconPlugConnected />
                  </EmptyMedia>
                  <EmptyTitle>No custom providers yet</EmptyTitle>
                  <EmptyDescription>
                    Add an OpenAI-compatible provider, then configure its models and metadata here.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <AddProviderDropdown onAddProvider={handleAddProvider} />
                </EmptyContent>
              </Empty>
            ) : filteredCustomProviderIds.length > 0 ? (
              <Accordion
                type="single"
                collapsible
                className="w-full"
                value={openCustomItem}
                onValueChange={handleCustomOpenChange}
              >
                {filteredCustomProviderIds.map((providerId) => (
                  <CustomProviderListItem
                    key={providerId}
                    providerId={providerId}
                    onDelete={() => handleDeleteProvider(providerId)}
                    onOpenChange={setOpenCustomItem}
                  />
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No custom providers found.
              </p>
            )}
          </CardContent>
        </Card>
      </SettingsTarget>

      <SettingsTarget id="setting-tts-providers">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Text-to-Speech Providers</CardTitle>
            <CardDescription>
              Choose which voice service reads assistant replies out loud and adjust how it sounds.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="tts-provider">Provider</FieldLabel>
                <Select
                  value={ttsSettings.provider}
                  onValueChange={(value) => {
                    const provider = value as (typeof TTS_PROVIDER_OPTIONS)[number]["id"];
                    trackSettingsInteraction("providers", "tts_provider_changed", { provider });
                    updateTtsSettings({
                      provider,
                    });
                  }}
                >
                  <SelectTrigger id="tts-provider" className="w-full md:max-w-96">
                    <SelectValue placeholder="Choose a voice provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {TTS_PROVIDER_OPTIONS.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Pick the service you want to use when you tap the speaker button.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="tts-model">Voice Model</FieldLabel>
                <Select
                  value={selectedTtsModel}
                  onValueChange={(model) => {
                    trackSettingsInteraction("providers", "tts_model_changed", { model });

                    if (ttsSettings.provider === "openai") {
                      updateTtsSettings({
                        openai: { ...ttsSettings.openai, model },
                      });
                    } else if (ttsSettings.provider === "elevenlabs") {
                      updateTtsSettings({
                        elevenlabs: { ...ttsSettings.elevenlabs, model },
                      });
                    } else if (ttsSettings.provider === "lmnt") {
                      updateTtsSettings({
                        lmnt: { ...ttsSettings.lmnt, model },
                      });
                    } else if (ttsSettings.provider === "hume") {
                      updateTtsSettings({
                        hume: { ...ttsSettings.hume, model },
                      });
                    }
                  }}
                  disabled={!selectedTtsProvider}
                >
                  <SelectTrigger id="tts-model" className="w-full md:max-w-96">
                    <SelectValue placeholder="Choose a voice model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(selectedTtsProvider?.models ?? []).map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {ttsSettings.provider === "openai" ? (
                <Field>
                  <FieldLabel htmlFor="tts-openai-api-key">API Key</FieldLabel>
                  <SecretInput
                    id="tts-openai-api-key"
                    value={openAiTtsApiKey}
                    onChange={setOpenAiTtsApiKey}
                    placeholder="Enter your OpenAI API key"
                    showSaveCancel
                  />
                </Field>
              ) : null}

              {ttsSettings.provider === "elevenlabs" ? (
                <Field>
                  <FieldLabel htmlFor="tts-elevenlabs-api-key">API Key</FieldLabel>
                  <SecretInput
                    id="tts-elevenlabs-api-key"
                    value={elevenLabsTtsApiKey}
                    onChange={setElevenLabsTtsApiKey}
                    placeholder="Enter your ElevenLabs API key"
                    showSaveCancel
                  />
                </Field>
              ) : null}

              {ttsSettings.provider === "lmnt" ? (
                <Field>
                  <FieldLabel htmlFor="tts-lmnt-api-key">API Key</FieldLabel>
                  <SecretInput
                    id="tts-lmnt-api-key"
                    value={lmntTtsApiKey}
                    onChange={setLmntTtsApiKey}
                    placeholder="Enter your LMNT API key"
                    showSaveCancel
                  />
                </Field>
              ) : null}

              {ttsSettings.provider === "hume" ? (
                <Field>
                  <FieldLabel htmlFor="tts-hume-api-key">API Key</FieldLabel>
                  <SecretInput
                    id="tts-hume-api-key"
                    value={humeTtsApiKey}
                    onChange={setHumeTtsApiKey}
                    placeholder="Enter your Hume API key"
                    showSaveCancel
                  />
                </Field>
              ) : null}

              {ttsSettings.provider === "openai" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="tts-openai-voice">Voice</FieldLabel>
                    <Select
                      value={ttsSettings.openai.voice}
                      onValueChange={(voice) =>
                        updateTtsSettings({
                          openai: { ...ttsSettings.openai, voice },
                        })
                      }
                    >
                      <SelectTrigger id="tts-openai-voice" className="w-full md:max-w-96">
                        <SelectValue placeholder="Choose a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {TTS_PROVIDER_OPTIONS.find(
                            (provider) => provider.id === "openai",
                          )?.voices.map((voice) => (
                            <SelectItem key={voice} value={voice}>
                              {voice}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tts-openai-speed">Speech Rate</FieldLabel>
                    <Input
                      id="tts-openai-speed"
                      type="number"
                      min="0.25"
                      max="4"
                      step="0.05"
                      value={ttsSettings.openai.speed}
                      onChange={(event) =>
                        updateTtsSettings({
                          openai: {
                            ...ttsSettings.openai,
                            speed: Number(event.target.value) || 1,
                          },
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tts-openai-instructions">How It Should Sound</FieldLabel>
                    <Textarea
                      id="tts-openai-instructions"
                      value={ttsSettings.openai.instructions}
                      onChange={(event) =>
                        updateTtsSettings({
                          openai: { ...ttsSettings.openai, instructions: event.target.value },
                        })
                      }
                      placeholder="Optional, for example: warm, calm, and conversational"
                    />
                  </Field>
                </>
              ) : null}

              {ttsSettings.provider === "elevenlabs" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="tts-elevenlabs-voice">Voice ID</FieldLabel>
                    <Input
                      id="tts-elevenlabs-voice"
                      value={ttsSettings.elevenlabs.voice}
                      onChange={(event) =>
                        updateTtsSettings({
                          elevenlabs: { ...ttsSettings.elevenlabs, voice: event.target.value },
                        })
                      }
                      placeholder="Paste a voice ID from ElevenLabs"
                    />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="tts-elevenlabs-speed">Speech Rate</FieldLabel>
                      <Input
                        id="tts-elevenlabs-speed"
                        type="number"
                        min="0.7"
                        max="1.2"
                        step="0.05"
                        value={ttsSettings.elevenlabs.speed}
                        onChange={(event) =>
                          updateTtsSettings({
                            elevenlabs: {
                              ...ttsSettings.elevenlabs,
                              speed: Number(event.target.value) || 1,
                            },
                          })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="tts-elevenlabs-language">Language Code</FieldLabel>
                      <Input
                        id="tts-elevenlabs-language"
                        value={ttsSettings.elevenlabs.languageCode}
                        onChange={(event) =>
                          updateTtsSettings({
                            elevenlabs: {
                              ...ttsSettings.elevenlabs,
                              languageCode: event.target.value,
                            },
                          })
                        }
                        placeholder="Optional, for example: en"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="tts-elevenlabs-stability">Stability</FieldLabel>
                      <Input
                        id="tts-elevenlabs-stability"
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={ttsSettings.elevenlabs.stability}
                        onChange={(event) =>
                          updateTtsSettings({
                            elevenlabs: {
                              ...ttsSettings.elevenlabs,
                              stability: Number(event.target.value) || 0,
                            },
                          })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="tts-elevenlabs-similarity">Voice Match</FieldLabel>
                      <Input
                        id="tts-elevenlabs-similarity"
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={ttsSettings.elevenlabs.similarityBoost}
                        onChange={(event) =>
                          updateTtsSettings({
                            elevenlabs: {
                              ...ttsSettings.elevenlabs,
                              similarityBoost: Number(event.target.value) || 0,
                            },
                          })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="tts-elevenlabs-style">Style Strength</FieldLabel>
                      <Input
                        id="tts-elevenlabs-style"
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={ttsSettings.elevenlabs.style}
                        onChange={(event) =>
                          updateTtsSettings({
                            elevenlabs: {
                              ...ttsSettings.elevenlabs,
                              style: Number(event.target.value) || 0,
                            },
                          })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="tts-elevenlabs-normalization">Text Cleanup</FieldLabel>
                      <Select
                        value={ttsSettings.elevenlabs.applyTextNormalization}
                        onValueChange={(value) =>
                          updateTtsSettings({
                            elevenlabs: {
                              ...ttsSettings.elevenlabs,
                              applyTextNormalization: value as "auto" | "on" | "off",
                            },
                          })
                        }
                      >
                        <SelectTrigger id="tts-elevenlabs-normalization" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="on">On</SelectItem>
                            <SelectItem value="off">Off</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="tts-elevenlabs-speaker-boost">
                      Boost Voice Match
                    </FieldLabel>
                    <Switch
                      id="tts-elevenlabs-speaker-boost"
                      checked={ttsSettings.elevenlabs.useSpeakerBoost}
                      onCheckedChange={(useSpeakerBoost) =>
                        updateTtsSettings({
                          elevenlabs: { ...ttsSettings.elevenlabs, useSpeakerBoost },
                        })
                      }
                    />
                  </Field>
                </>
              ) : null}

              {ttsSettings.provider === "lmnt" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="tts-lmnt-voice">Voice</FieldLabel>
                    <Input
                      id="tts-lmnt-voice"
                      value={ttsSettings.lmnt.voice}
                      onChange={(event) =>
                        updateTtsSettings({
                          lmnt: { ...ttsSettings.lmnt, voice: event.target.value },
                        })
                      }
                      placeholder="e.g. ava"
                    />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="tts-lmnt-language">Language Code</FieldLabel>
                      <Input
                        id="tts-lmnt-language"
                        value={ttsSettings.lmnt.language}
                        onChange={(event) =>
                          updateTtsSettings({
                            lmnt: { ...ttsSettings.lmnt, language: event.target.value },
                          })
                        }
                        placeholder="e.g. en"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="tts-lmnt-speed">Speech Rate</FieldLabel>
                      <Input
                        id="tts-lmnt-speed"
                        type="number"
                        min="0.25"
                        max="2"
                        step="0.05"
                        value={ttsSettings.lmnt.speed}
                        onChange={(event) =>
                          updateTtsSettings({
                            lmnt: {
                              ...ttsSettings.lmnt,
                              speed: Number(event.target.value) || 1,
                            },
                          })
                        }
                      />
                    </Field>
                  </div>
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="tts-lmnt-conversational">Conversational Voice</FieldLabel>
                    <Switch
                      id="tts-lmnt-conversational"
                      checked={ttsSettings.lmnt.conversational}
                      onCheckedChange={(conversational) =>
                        updateTtsSettings({
                          lmnt: { ...ttsSettings.lmnt, conversational },
                        })
                      }
                    />
                  </Field>
                </>
              ) : null}

              {ttsSettings.provider === "hume" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="tts-hume-voice">Voice ID</FieldLabel>
                    <Input
                      id="tts-hume-voice"
                      value={ttsSettings.hume.voice}
                      onChange={(event) =>
                        updateTtsSettings({
                          hume: { ...ttsSettings.hume, voice: event.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tts-hume-speed">Speech Rate</FieldLabel>
                    <Input
                      id="tts-hume-speed"
                      type="number"
                      step="0.05"
                      value={ttsSettings.hume.speed}
                      onChange={(event) =>
                        updateTtsSettings({
                          hume: {
                            ...ttsSettings.hume,
                            speed: Number(event.target.value) || 1,
                          },
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tts-hume-instructions">How It Should Sound</FieldLabel>
                    <Textarea
                      id="tts-hume-instructions"
                      value={ttsSettings.hume.instructions}
                      onChange={(event) =>
                        updateTtsSettings({
                          hume: { ...ttsSettings.hume, instructions: event.target.value },
                        })
                      }
                      placeholder="Optional, for example: upbeat and friendly"
                    />
                  </Field>
                </>
              ) : null}
            </FieldGroup>
          </CardContent>
        </Card>
      </SettingsTarget>

      <SettingsTarget id="setting-model-directory">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Model List Updates</CardTitle>
            <CardDescription>Download the latest built-in provider model metadata.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  {modelDirectoryStatus.usingDownloadedList
                    ? "Using downloaded model list"
                    : "Using bundled model list"}
                </p>
                <p className="text-muted-foreground text-sm tabular-nums">
                  Last updated: {formatModelDirectoryTimestamp(modelDirectoryStatus.fetchedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleUpdateModelDirectory}
                  disabled={isUpdatingModelDirectory}
                  size="sm"
                >
                  {isUpdatingModelDirectory ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <IconRefresh data-icon="inline-start" />
                  )}
                  Update now
                </Button>
                <Button
                  onClick={handleResetModelDirectory}
                  disabled={isUpdatingModelDirectory || !modelDirectoryStatus.usingDownloadedList}
                  variant="outline"
                  size="sm"
                >
                  <IconRestore data-icon="inline-start" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </SettingsTarget>
    </div>
  );
}
