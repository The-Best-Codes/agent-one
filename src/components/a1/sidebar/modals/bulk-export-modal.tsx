import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatIds: string[];
  chatCount: number;
  onComplete: () => void;
}

export const BulkExportModal = ({ isOpen, onClose, chatIds, chatCount, onComplete }: BulkExportModalProps) => {
  const { loadFullChatData } = usePersistence();

  const handleExportJSON = async () => {
    const chatDataArray = await Promise.all(chatIds.map((chatId) => loadFullChatData(chatId)));
    const dataStr = JSON.stringify(chatDataArray, null, 2);
    const filePath = await save({
      defaultPath: "agent-one-chats-export.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (filePath) {
      await writeTextFile(filePath, dataStr);
    }
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export {chatCount} Chats</DialogTitle>
          <DialogDescription>
            Export {chatCount} selected chats as a single JSON file.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => handleExportJSON().catch(logger.error)}
            className="justify-start"
          >
            <DownloadIcon className="size-4" />
            Download as JSON
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
