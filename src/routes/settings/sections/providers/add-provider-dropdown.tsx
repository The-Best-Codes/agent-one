import { IconChevronDown, IconPlus } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProviderModelMetadata } from "@/lib/ai/providers/provider-models";

import { AddOpenAICompatibleDialog } from "./add-openai-compatible-dialog";

interface NewProviderData {
  name: string;
  baseUrl: string;
  headers: Record<string, string>;
  models: ProviderModelMetadata[];
}

interface AddProviderDropdownProps {
  onAddProvider: (data: NewProviderData, apiKey: string) => void;
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
