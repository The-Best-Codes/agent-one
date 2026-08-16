import { IconLanguage } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [pendingLanguage, setPendingLanguage] = useState<SupportedLanguage | null>(null);

  const handleChange = (value: string) => {
    const nextLanguage = value as SupportedLanguage;
    if (nextLanguage === "en") {
      setLanguage(nextLanguage);
      return;
    }
    setPendingLanguage(nextLanguage);
  };

  const pendingLabel =
    supportedLanguages.find((option) => option.value === pendingLanguage)?.label ?? "";

  return (
    <>
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

      <Dialog
        open={pendingLanguage !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingLanguage(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.languageWarningTitle")}</DialogTitle>
            <DialogDescription>
              {t("settings.languageWarningDescription", { language: pendingLabel })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingLanguage(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (pendingLanguage) {
                  setLanguage(pendingLanguage);
                }
                setPendingLanguage(null);
              }}
            >
              {t("settings.switchLanguage")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
