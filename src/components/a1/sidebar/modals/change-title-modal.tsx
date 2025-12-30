import { Loader2Icon, SparklesIcon } from "lucide-react";
import { useState } from "react";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useModels } from "@/hooks/ai/use-models";
import { generateChatTitle } from "@/lib/ai/title-generator";

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
  const { saveChatTitle, loadChatData } = usePersistence();
  const { getModelById } = useModels();

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
      const chatData = loadChatData(chatId);
      const modelConfig = getModelById(chatData.modelId || "");
      if (modelConfig) {
        const generatedTitle = await generateChatTitle(
          modelConfig.model,
          chatData.messages,
          "none",
        );
        setTitle(generatedTitle);
      }
    } catch (error) {
      console.error("Failed to generate title:", error);
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="outline"
                size="icon"
              >
                {isGenerating ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SparklesIcon className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate title using AI</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
          <DialogDescription>
            Enter a new title for this chat conversation.
          </DialogDescription>
        </DialogHeader>
        <ChangeTitleForm
          currentTitle={currentTitle}
          chatId={chatId}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
