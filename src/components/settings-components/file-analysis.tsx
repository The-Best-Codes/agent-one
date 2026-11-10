import { IconRestore } from "@tabler/icons-react";
import { useAtom } from "jotai";

import { ModelSelector } from "@/components/a1/chat-model-selector";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";
import type { FileKind } from "@/lib/attachments";
import { settingAtoms } from "@/lib/jotai/settings-atoms";

const KINDS: { kind: FileKind; label: string }[] = [
  { kind: "image", label: "Images" },
  { kind: "video", label: "Videos" },
  { kind: "audio", label: "Audio" },
  { kind: "pdf", label: "PDFs" },
  { kind: "other", label: "Other files" },
];

export function FileAnalysisModelsControl() {
  const [value, setValue] = useAtom(settingAtoms.FILE_ANALYSIS_MODELS);
  const { getChatModelById } = useModelCatalog();
  const modelIds = value && typeof value === "object" ? value : {};

  return (
    <FieldGroup className="gap-1.5">
      {KINDS.map(({ kind, label }) => {
        const modelId = typeof modelIds[kind] === "string" ? modelIds[kind] : "";
        const model = modelId ? (getChatModelById(modelId) ?? null) : null;
        return (
          <Field key={kind} orientation="horizontal">
            <FieldLabel htmlFor={`file-analysis-model-${kind}`}>{label}</FieldLabel>
            <div className="flex min-w-0 items-center gap-1">
              <ModelSelector
                id={`file-analysis-model-${kind}`}
                value={model}
                onValueChange={(id) => setValue({ ...modelIds, [kind]: id })}
                placeholder={modelId ? "Unavailable, using chat model" : "Same as chat model"}
                className="w-60 max-w-full"
                popoverClassName="w-60"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setValue({ ...modelIds, [kind]: "" })}
                disabled={!modelId}
                aria-label={`Reset ${label.toLowerCase()} model to default`}
              >
                <IconRestore />
              </Button>
            </div>
          </Field>
        );
      })}
    </FieldGroup>
  );
}
