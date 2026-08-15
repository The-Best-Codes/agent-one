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

interface ExportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatTitle: string;
}

export const ExportChatModal = ({ isOpen, onClose, chatId, chatTitle }: ExportChatModalProps) => {
  const { t } = useTranslation();
  const { loadFullChatData } = usePersistence();
  const handleExportJSON = async () => {
    const chatData = await loadFullChatData(chatId);
    const dataStr = JSON.stringify(chatData, null, 2);
    const filePath = await save({
      defaultPath: `${chatTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (filePath) {
      await writeTextFile(filePath, dataStr);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sidebar.exportChat")}</DialogTitle>
          <DialogDescription>
            {t("sidebar.exportChatDescription", { title: chatTitle })}
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
