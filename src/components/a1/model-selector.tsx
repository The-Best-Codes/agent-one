import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModel } from "@/contexts/use-model/model-hooks";
import { AVAILABLE_MODELS } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import React from "react";

// TODO: Use a combobox to make this searchable

interface ModelSelectorProps {
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ className }) => {
  const { currentModel, setModel } = useModel();

  const handleModelChange = (modelId: string) => {
    setModel(modelId);
  };

  return (
    <Select onValueChange={handleModelChange} value={currentModel.id}>
      <SelectTrigger
        className={cn("w-full", className)}
        aria-label={`Model: ${currentModel.name}`}
      >
        <SelectValue>
          <div className="flex flex-row items-center">
            <span className="text-xs text-muted-foreground">
              {currentModel.provider}/
            </span>
            <span className="font-medium">{currentModel.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {AVAILABLE_MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex flex-row items-center">
              <span className="text-xs text-muted-foreground">
                {model.provider}/
              </span>
              <span className="font-medium">{model.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
