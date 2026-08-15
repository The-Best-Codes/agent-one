import { IconPlugConnected } from "@tabler/icons-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { SecretInput } from "@/components/a1/input/secret-input";
import { SearchInput } from "@/components/a1/search-input";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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

export function ProvidersList() {
  const { t } = useTranslation();
  const [builtInSearchQuery, setBuiltInSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [customSearchQuery, setCustomSearchQuery] = useState("");
  const [openBuiltInItem, setOpenBuiltInItem] = useState("");
  const [openLocalItem, setOpenLocalItem] = useState("");
  const [openCustomItem, setOpenCustomItem] = useState("");

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
  const setGoogleTtsApiKey = useSetAtom(apiKeyAtomFamily("tts-google"));
  const ttsSettings = normalizeTtsSettings(rawTtsSettings);
  const selectedTtsProvider = TTS_PROVIDER_OPTIONS.find(
    (provider) => provider.id === ttsSettings.provider,
  );
  const selectedTtsModel = getSelectedTtsModel(ttsSettings);
  const openAiTtsApiKey = useAtomValue(apiKeyAtomFamily("tts-openai"));
  const elevenLabsTtsApiKey = useAtomValue(apiKeyAtomFamily("tts-elevenlabs"));
  const lmntTtsApiKey = useAtomValue(apiKeyAtomFamily("tts-lmnt"));
  const humeTtsApiKey = useAtomValue(apiKeyAtomFamily("tts-hume"));
  const googleTtsApiKey = useAtomValue(apiKeyAtomFamily("tts-google"));

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

  return (
    <div className="flex flex-col gap-4">
      <SettingsTarget id="setting-built-in-providers">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("providers.builtInProviders")}</CardTitle>
            <CardDescription>{t("providers.builtInProvidersDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SearchInput
              placeholder={t("providers.searchBuiltIn")}
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
                {t("providers.noBuiltInFound")}
              </p>
            )}
          </CardContent>
        </Card>
      </SettingsTarget>

      <SettingsTarget id="setting-local-providers">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("providers.localProviders")}</CardTitle>
            <CardDescription>{t("providers.localProvidersDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SearchInput
              placeholder={t("providers.searchLocal")}
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
                {t("providers.noLocalFound")}
              </p>
            )}
          </CardContent>
        </Card>
      </SettingsTarget>

      <SettingsTarget id="setting-custom-providers">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("providers.customProviders")}</CardTitle>
            <CardDescription>{t("providers.customProvidersDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-2">
              <SearchInput
                placeholder={t("providers.searchCustom")}
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
                  <EmptyTitle>{t("providers.noCustomProviders")}</EmptyTitle>
                  <EmptyDescription>{t("providers.noCustomProvidersDescription")}</EmptyDescription>
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
                {t("providers.noCustomFound")}
              </p>
            )}
          </CardContent>
        </Card>
      </SettingsTarget>

      <SettingsTarget id="setting-tts-providers">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("tts.providersTitle")}</CardTitle>
            <CardDescription>{t("tts.providersDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="tts-provider">{t("tts.provider")}</FieldLabel>
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
                    <SelectValue placeholder={t("providers.chooseVoiceProvider")} />
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
                <FieldDescription>{t("tts.pickService")}</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="tts-model">{t("tts.voiceModel")}</FieldLabel>
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
                    } else if (ttsSettings.provider === "google") {
                      updateTtsSettings({
                        google: { ...ttsSettings.google, model },
                      });
                    }
                  }}
                  disabled={!selectedTtsProvider}
                >
                  <SelectTrigger id="tts-model" className="w-full md:max-w-96">
                    <SelectValue placeholder={t("providers.chooseVoiceModel")} />
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
                  <FieldLabel htmlFor="tts-openai-api-key">{t("providers.apiKey")}</FieldLabel>
                  <SecretInput
                    id="tts-openai-api-key"
                    value={openAiTtsApiKey}
                    onChange={setOpenAiTtsApiKey}
                    placeholder={t("providers.enterOpenaiKey")}
                    showSaveCancel
                  />
                </Field>
              ) : null}

              {ttsSettings.provider === "elevenlabs" ? (
                <Field>
                  <FieldLabel htmlFor="tts-elevenlabs-api-key">{t("providers.apiKey")}</FieldLabel>
                  <SecretInput
                    id="tts-elevenlabs-api-key"
                    value={elevenLabsTtsApiKey}
                    onChange={setElevenLabsTtsApiKey}
                    placeholder={t("providers.enterElevenLabsKey")}
                    showSaveCancel
                  />
                </Field>
              ) : null}

              {ttsSettings.provider === "lmnt" ? (
                <Field>
                  <FieldLabel htmlFor="tts-lmnt-api-key">{t("providers.apiKey")}</FieldLabel>
                  <SecretInput
                    id="tts-lmnt-api-key"
                    value={lmntTtsApiKey}
                    onChange={setLmntTtsApiKey}
                    placeholder={t("providers.enterLmntKey")}
                    showSaveCancel
                  />
                </Field>
              ) : null}

              {ttsSettings.provider === "hume" ? (
                <Field>
                  <FieldLabel htmlFor="tts-hume-api-key">{t("providers.apiKey")}</FieldLabel>
                  <SecretInput
                    id="tts-hume-api-key"
                    value={humeTtsApiKey}
                    onChange={setHumeTtsApiKey}
                    placeholder={t("providers.enterHumeKey")}
                    showSaveCancel
                  />
                </Field>
              ) : null}

              {ttsSettings.provider === "google" ? (
                <Field>
                  <FieldLabel htmlFor="tts-google-api-key">{t("providers.apiKey")}</FieldLabel>
                  <SecretInput
                    id="tts-google-api-key"
                    value={googleTtsApiKey}
                    onChange={setGoogleTtsApiKey}
                    placeholder={t("providers.enterGoogleKey")}
                    showSaveCancel
                  />
                </Field>
              ) : null}

              {ttsSettings.provider === "openai" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="tts-openai-voice">{t("tts.voice")}</FieldLabel>
                    <Select
                      value={ttsSettings.openai.voice}
                      onValueChange={(voice) =>
                        updateTtsSettings({
                          openai: { ...ttsSettings.openai, voice },
                        })
                      }
                    >
                      <SelectTrigger id="tts-openai-voice" className="w-full md:max-w-96">
                        <SelectValue placeholder={t("providers.chooseVoice")} />
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
                    <FieldLabel htmlFor="tts-openai-speed">{t("tts.speechRate")}</FieldLabel>
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
                    <FieldLabel htmlFor="tts-openai-instructions">
                      {t("tts.howItShouldSound")}
                    </FieldLabel>
                    <Textarea
                      id="tts-openai-instructions"
                      value={ttsSettings.openai.instructions}
                      onChange={(event) =>
                        updateTtsSettings({
                          openai: { ...ttsSettings.openai, instructions: event.target.value },
                        })
                      }
                      placeholder={t("providers.voiceInstructionsPlaceholder")}
                    />
                  </Field>
                </>
              ) : null}

              {ttsSettings.provider === "elevenlabs" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="tts-elevenlabs-voice">{t("tts.voiceId")}</FieldLabel>
                    <Input
                      id="tts-elevenlabs-voice"
                      value={ttsSettings.elevenlabs.voice}
                      onChange={(event) =>
                        updateTtsSettings({
                          elevenlabs: { ...ttsSettings.elevenlabs, voice: event.target.value },
                        })
                      }
                      placeholder={t("providers.pasteElevenLabsVoiceId")}
                    />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="tts-elevenlabs-speed">{t("tts.speechRate")}</FieldLabel>
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
                      <FieldLabel htmlFor="tts-elevenlabs-language">
                        {t("tts.languageCode")}
                      </FieldLabel>
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
                        placeholder={t("providers.languagePlaceholder")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="tts-elevenlabs-stability">
                        {t("tts.stability")}
                      </FieldLabel>
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
                      <FieldLabel htmlFor="tts-elevenlabs-similarity">
                        {t("tts.voiceMatch")}
                      </FieldLabel>
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
                      <FieldLabel htmlFor="tts-elevenlabs-style">
                        {t("tts.styleStrength")}
                      </FieldLabel>
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
                      <FieldLabel htmlFor="tts-elevenlabs-normalization">
                        {t("tts.textCleanup")}
                      </FieldLabel>
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
                            <SelectItem value="auto">{t("tts.auto")}</SelectItem>
                            <SelectItem value="on">{t("tts.on")}</SelectItem>
                            <SelectItem value="off">{t("common.off")}</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="tts-elevenlabs-speaker-boost">
                      {t("tts.boostVoiceMatch")}
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
                    <FieldLabel htmlFor="tts-lmnt-voice">{t("tts.voice")}</FieldLabel>
                    <Input
                      id="tts-lmnt-voice"
                      value={ttsSettings.lmnt.voice}
                      onChange={(event) =>
                        updateTtsSettings({
                          lmnt: { ...ttsSettings.lmnt, voice: event.target.value },
                        })
                      }
                      placeholder={t("tts.voiceExampleAva")}
                    />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="tts-lmnt-language">{t("tts.languageCode")}</FieldLabel>
                      <Input
                        id="tts-lmnt-language"
                        value={ttsSettings.lmnt.language}
                        onChange={(event) =>
                          updateTtsSettings({
                            lmnt: { ...ttsSettings.lmnt, language: event.target.value },
                          })
                        }
                        placeholder={t("tts.languageExampleEn")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="tts-lmnt-speed">{t("tts.speechRate")}</FieldLabel>
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
                    <FieldLabel htmlFor="tts-lmnt-conversational">
                      {t("tts.conversationalVoice")}
                    </FieldLabel>
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
                    <FieldLabel htmlFor="tts-hume-voice">{t("tts.voiceId")}</FieldLabel>
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
                    <FieldLabel htmlFor="tts-hume-speed">{t("tts.speechRate")}</FieldLabel>
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
                    <FieldLabel htmlFor="tts-hume-instructions">
                      {t("tts.howItShouldSound")}
                    </FieldLabel>
                    <Textarea
                      id="tts-hume-instructions"
                      value={ttsSettings.hume.instructions}
                      onChange={(event) =>
                        updateTtsSettings({
                          hume: { ...ttsSettings.hume, instructions: event.target.value },
                        })
                      }
                      placeholder={t("providers.voiceInstructionsUpbeat")}
                    />
                  </Field>
                </>
              ) : null}

              {ttsSettings.provider === "google" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="tts-google-voice">{t("tts.voice")}</FieldLabel>
                    <Select
                      value={ttsSettings.google.voice}
                      onValueChange={(voice) =>
                        updateTtsSettings({
                          google: { ...ttsSettings.google, voice },
                        })
                      }
                    >
                      <SelectTrigger id="tts-google-voice" className="w-full md:max-w-96">
                        <SelectValue placeholder={t("providers.chooseVoice")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {TTS_PROVIDER_OPTIONS.find(
                            (provider) => provider.id === "google",
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
                    <FieldLabel htmlFor="tts-google-speed">{t("tts.speechRate")}</FieldLabel>
                    <Input
                      id="tts-google-speed"
                      type="number"
                      min="0.25"
                      max="4"
                      step="0.05"
                      value={ttsSettings.google.speed}
                      onChange={(event) =>
                        updateTtsSettings({
                          google: {
                            ...ttsSettings.google,
                            speed: Number(event.target.value) || 1,
                          },
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tts-google-instructions">
                      {t("tts.howItShouldSound")}
                    </FieldLabel>
                    <Textarea
                      id="tts-google-instructions"
                      value={ttsSettings.google.instructions}
                      onChange={(event) =>
                        updateTtsSettings({
                          google: { ...ttsSettings.google, instructions: event.target.value },
                        })
                      }
                      placeholder={t("providers.voiceInstructionsPlaceholder")}
                    />
                  </Field>
                </>
              ) : null}
            </FieldGroup>
          </CardContent>
        </Card>
      </SettingsTarget>
    </div>
  );
}
