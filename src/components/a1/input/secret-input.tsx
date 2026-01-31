import { EyeIcon, EyeOffIcon, RotateCcwIcon, SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  placeholder = "Enter secret value",
  className,
  showSaveCancel = false,
}: SecretInputProps) {
  const [showValue, setShowValue] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
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
    <div className={`flex gap-2 ${className ?? ""}`}>
      <Input
        id={id}
        type={showValue ? "text" : "password"}
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
      <Button
        type="button"
        onClick={() => setShowValue(!showValue)}
        variant="outline"
        size="icon"
        title={showValue ? "Hide value" : "Show value"}
      >
        {showValue ? (
          <EyeOffIcon className="size-4" />
        ) : (
          <EyeIcon className="size-4" />
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
            title="Save"
          >
            <SaveIcon className="size-4" />
          </Button>
          <Button
            type="button"
            onClick={handleCancel}
            disabled={!hasChanges}
            variant="outline"
            size="icon"
            title="Cancel changes"
          >
            <RotateCcwIcon className="size-4" />
          </Button>
        </>
      )}
    </div>
  );
}
