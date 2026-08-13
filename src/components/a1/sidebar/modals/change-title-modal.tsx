import { IconSparkles } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useState } from "react";

import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { generateChatTitleAI } from "@/lib/ai/title-generator";
import { extractReasoningEnabledAtom, titleGenerationAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

interface ChangeTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentTitle: string;
}

const ChangeTitleForm = ({
  currentTitle,
  chatId,
  onClose,
}: {
  currentTitle: string;
  chatId: string;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState(currentTitle);
  const [isGenerating, setIsGenerating] = useState(false);
  const { saveChatTitle, loadChatMetadata, loadChatMessages } = usePersistence();
  const { getModelById } = useModelCatalog();
  const titleGenerationSettings = useAtomValue(titleGenerationAtom);
  const extractReasoningEnabled = useAtomValue(extractReasoningEnabledAtom);

  const handleSave = () => {
    if (title.trim() && title.trim() !== currentTitle) {
      saveChatTitle({ chatId, title: title.trim() });
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const chatMetadata = loadChatMetadata(chatId);
      const messages = await loadChatMessages(chatId);
      const modelConfig = getModelById(chatMetadata.modelId || "");
      if (modelConfig) {
        const generatedTitle = await generateChatTitleAI(
          modelConfig.model,
          messages,
          titleGenerationSettings.fallbackPhrase,
          "none",
          extractReasoningEnabled,
        );
        setTitle(generatedTitle);
      }
    } catch (error) {
      logger.error("Failed to generate title:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter chat title..."
          autoFocus
          className="flex-1"
        />
        <AdaptiveTooltip>
          <AdaptiveTooltipTrigger asChild>
            <Button onClick={handleGenerate} disabled={isGenerating} variant="outline" size="icon">
              {isGenerating ? <Spinner /> : <IconSparkles />}
            </Button>
          </AdaptiveTooltipTrigger>
          <AdaptiveTooltipContent>
            <p>Generate title using AI</p>
          </AdaptiveTooltipContent>
        </AdaptiveTooltip>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!title.trim()}>
          Save
        </Button>
      </DialogFooter>
    </>
  );
};

export const ChangeTitleModal = ({
  isOpen,
  onClose,
  chatId,
  currentTitle,
}: ChangeTitleModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Chat Title</DialogTitle>
          <DialogDescription>Enter a new title for this chat conversation.</DialogDescription>
        </DialogHeader>
        <ChangeTitleForm currentTitle={currentTitle} chatId={chatId} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};
