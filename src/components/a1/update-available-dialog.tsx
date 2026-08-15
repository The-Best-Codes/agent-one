import { IconChevronDown, IconClock, IconDownload, IconRocket } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdate } from "@/contexts/use-update/update-hooks";

export function UpdateAvailableDialog() {
  const { t } = useTranslation();
  const { dialogOpen, updateVersion, handleRemind, dismissDialog } = useUpdate();
  const navigate = useNavigate();

  return (
    <Dialog open={dialogOpen}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <IconRocket className="text-primary size-5" />
            <DialogTitle>{t("dialogs.updateAvailable")}</DialogTitle>
          </div>
          <DialogDescription>
            {t("dialogs.updateAvailableDescription", { version: updateVersion })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <ButtonGroup>
            <Button variant="outline" size="sm" onClick={() => handleRemind(1)}>
              <IconClock data-icon="inline-start" />
              {t("dialogs.remind1Day")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm">
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-max">
                <DropdownMenuItem onClick={() => handleRemind(3)}>
                  {t("dialogs.remind3Days")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRemind(7)}>
                  {t("dialogs.remind1Week")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRemind(14)}>
                  {t("dialogs.remind2Weeks")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
          <Button
            size="sm"
            onClick={() => {
              dismissDialog();
              void navigate("/settings?tab=about");
            }}
          >
            <IconDownload data-icon="inline-start" />
            {t("dialogs.update")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
