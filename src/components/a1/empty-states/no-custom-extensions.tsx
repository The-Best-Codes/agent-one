import { useTranslation } from "react-i18next";

export const NoCustomExtensions = () => {
  const { t } = useTranslation();
  return (
    <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
      {t("empty.noCustomExtensions")}
    </div>
  );
};
