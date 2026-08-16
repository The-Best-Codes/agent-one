import { IconLanguage } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supportedLanguages, type SupportedLanguage } from "@/lib/i18n";
import { languageAtom } from "@/lib/jotai/settings-atoms";

interface LanguagePickerProps {
  className?: string;
  id?: string;
}

export function LanguagePicker({ className, id }: LanguagePickerProps) {
  const { t } = useTranslation();
  const [language, setLanguage] = useAtom(languageAtom);

  const handleChange = (value: string) => {
    setLanguage(value as SupportedLanguage);
  };

  return (
    <Select value={language} onValueChange={handleChange}>
      <SelectTrigger className={className} id={id} aria-label={t("settings.selectLanguage")}>
        <IconLanguage className="text-muted-foreground" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {supportedLanguages.map((languageOption) => (
            <SelectItem key={languageOption.value} value={languageOption.value}>
              {languageOption.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
