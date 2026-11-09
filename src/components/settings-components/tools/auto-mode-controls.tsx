import { useAtom } from "jotai";

import { ModelSelector } from "@/components/a1/chat-model-selector";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { settingAtoms } from "@/lib/jotai/settings-atoms";

export function AutoModeModelControl() {
  const [modelId, setModelId] = useAtom(settingAtoms.AUTO_MODE_MODEL);
  const { getChatModelById } = useModelCatalog();
  const model = modelId ? (getChatModelById(modelId) ?? null) : null;

  return (
    <ModelSelector
      id="auto-mode-model-control"
      value={model}
      onValueChange={setModelId}
      placeholder={modelId ? "Unavailable, using chat model" : "Same as chat model"}
      className="w-60 max-w-full"
      popoverClassName="w-60"
    />
  );
}
