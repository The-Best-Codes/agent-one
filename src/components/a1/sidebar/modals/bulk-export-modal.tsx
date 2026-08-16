import { IconDownload } from "@tabler/icons-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useTranslation } from "react-i18next";

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
}

export const BulkExportModal = ({ isOpen, onClose, chatIds, chatCount }: BulkExportModalProps) => {
  const { t } = useTranslation();
  const { bulkExportChats } = usePersistence();

  const handleExportJSON = async () => {
    const chatDataArray = await bulkExportChats(chatIds);
    const dataStr = JSON.stringify(chatDataArray, null, 2);
    const filePath = await save({
      defaultPath: "agent-one-chats-export.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!filePath) {
      return;
    }
    await writeTextFile(filePath, dataStr);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sidebar.exportChatsTitle", { count: chatCount })}</DialogTitle>
          <DialogDescription>
            {t("sidebar.exportChatsDescription", { count: chatCount })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => handleExportJSON().catch(logger.error)}
            className="justify-start"
          >
            <IconDownload data-icon="inline-start" />
            {t("sidebar.downloadJson")}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
