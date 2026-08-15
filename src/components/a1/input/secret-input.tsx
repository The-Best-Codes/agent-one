import { IconDeviceFloppy, IconEye, IconEyeClosed, IconRestore } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SecretInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showSaveCancel?: boolean;
}

export function SecretInput({
  id,
  value,
  onChange,
  placeholder,
  className,
  showSaveCancel = false,
}: SecretInputProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("input.enterSecret");
  const [showValue, setShowValue] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputValue(value);
  }, [value]);

  const hasChanges = inputValue !== value;

  const handleSave = () => {
    onChange(inputValue);
  };

  const handleCancel = () => {
    setInputValue(value);
  };

  const handleChange = (newValue: string) => {
    setInputValue(newValue);
    if (!showSaveCancel) {
      onChange(newValue);
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Input
        id={id}
        type={showValue ? "text" : "password"}
        autoSave="off"
        autoComplete="off"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        className="flex-1"
      />
      <Button
        type="button"
        onClick={() => setShowValue(!showValue)}
        variant="outline"
        size="icon"
        title={showValue ? t("common.hideValue") : t("common.showValue")}
      >
        {showValue ? (
          <IconEyeClosed data-icon="inline-start" />
        ) : (
          <IconEye data-icon="inline-start" />
        )}
      </Button>
      {showSaveCancel && (
        <>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            variant="outline"
            size="icon"
            title={t("common.save")}
          >
            <IconDeviceFloppy data-icon="inline-start" />
          </Button>
          <Button
            type="button"
            onClick={handleCancel}
            disabled={!hasChanges}
            variant="outline"
            size="icon"
            title={t("common.cancelChanges")}
          >
            <IconRestore data-icon="inline-start" />
          </Button>
        </>
      )}
    </div>
  );
}
