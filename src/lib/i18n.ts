import i18n from "i18next";
import { getDefaultStore } from "jotai";
import { initReactI18next } from "react-i18next";

import en from "./i18n/en.json";
import es from "./i18n/es.json";
import fr from "./i18n/fr.json";
import ru from "./i18n/ru.json";
import { languageAtom } from "./jotai/settings-atoms";
import { LANGUAGE_OPTIONS, type LanguageOption } from "./settings/types";

export const supportedLanguages = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "ru", label: "Русский" },
] as const satisfies readonly { value: LanguageOption; label: string }[];

export type SupportedLanguage = LanguageOption;

const FALLBACK_LNG: SupportedLanguage = "en";

function resolveInitialLanguage(): SupportedLanguage {
  const stored = getDefaultStore().get(languageAtom);
  if (LANGUAGE_OPTIONS.includes(stored)) {
    return stored;
  }

  const browserLanguage = navigator.language?.split("-")[0] ?? "";
  return (LANGUAGE_OPTIONS as readonly string[]).includes(browserLanguage)
    ? (browserLanguage as SupportedLanguage)
    : FALLBACK_LNG;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    ru: { translation: ru },
  },
  lng: resolveInitialLanguage(),
  fallbackLng: FALLBACK_LNG,
  interpolation: {
    escapeValue: false,
  },
});

getDefaultStore().sub(languageAtom, () => {
  const language = getDefaultStore().get(languageAtom);
  if (LANGUAGE_OPTIONS.includes(language)) {
    void i18n.changeLanguage(language);
  }
});

export default i18n;
