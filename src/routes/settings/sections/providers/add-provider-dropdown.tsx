import { IconChevronDown, IconPlus } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NewCustomProviderData } from "@/lib/jotai/custom-provider-atoms";

import { AddOpenAICompatibleDialog } from "./provider-dialogs";

interface AddProviderDropdownProps {
  onAddProvider: (data: NewCustomProviderData, apiKey: string) => void;
}

export function AddProviderDropdown({ onAddProvider }: AddProviderDropdownProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Add Provider
            <IconChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-max">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
              <IconPlus data-icon="inline-start" />
              OpenAI Compatible
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
