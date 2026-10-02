import { IconDeviceFloppy, IconEye, IconEyeClosed, IconRestore } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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
  const resolvedPlaceholder = placeholder ?? "Enter secret value";
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
    <div className={cn("flex items-center gap-1", className)}>
      <InputGroup className="flex-1">
        <InputGroupInput
          id={id}
          type={showValue ? "text" : "password"}
          autoSave="off"
          autoComplete="off"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={resolvedPlaceholder}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            onClick={() => setShowValue((previous) => !previous)}
            size="icon-xs"
            title={showValue ? "Hide value" : "Show value"}
            aria-label={showValue ? "Hide value" : "Show value"}
            aria-pressed={showValue}
          >
            {showValue ? <IconEyeClosed /> : <IconEye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {showSaveCancel && hasChanges && (
        <>
          <Button type="button" onClick={handleSave} variant="default" title="Save">
            <IconDeviceFloppy data-icon="inline-start" />
            Save
          </Button>
          <Button type="button" onClick={handleCancel} variant="destructive" title="Revert changes">
            <IconRestore data-icon="inline-start" />
            Revert
          </Button>
        </>
      )}
    </div>
  );
}
