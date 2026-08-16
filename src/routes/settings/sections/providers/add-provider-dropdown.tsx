import { IconChevronDown, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import type { NewCustomProviderData } from "@/lib/jotai/custom-provider-atoms";

import { AddOpenAICompatibleDialog } from "./provider-dialogs";

interface AddProviderDropdownProps {
  onAddProvider: (data: NewCustomProviderData, apiKey: string) => void;
}

export function AddProviderDropdown({ onAddProvider }: AddProviderDropdownProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            analytics={{
              event: "settings_interaction",
              params: { section: "providers", control: "add_provider_menu_opened" },
            }}
          >
            {t("providers.addProvider")}
            <IconChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-max">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() => {
                trackSettingsInteraction("providers", "open_openai_compatible_dialog");
                setDialogOpen(true);
              }}
            >
              <IconPlus data-icon="inline-start" />
              {t("providers.openaiCompatible")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddOpenAICompatibleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={onAddProvider}
      />
    </>
  );
}
