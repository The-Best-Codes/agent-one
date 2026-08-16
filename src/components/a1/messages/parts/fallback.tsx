import { useTranslation } from "react-i18next";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MessagePartFallback = ({ ...props }: any) => {
  const { t } = useTranslation();
  return (
    <div className="bg-destructive flex max-w-full flex-col rounded-md text-white">
      <span>{t("messages.unknownPart")}</span>
      <pre className="font-mono">{JSON.stringify(props)}</pre>
    </div>
  );
};
