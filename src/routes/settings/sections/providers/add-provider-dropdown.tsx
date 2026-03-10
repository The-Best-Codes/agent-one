import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CustomProviderModel } from "@/lib/jotai/custom-provider-atoms";

import { AddOpenAICompatibleDialog } from "./add-openai-compatible-dialog";

interface NewProviderData {
  name: string;
  baseUrl: string;
  headers: Record<string, string>;
  models: CustomProviderModel[];
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
            <ChevronDownIcon data-icon="inline-start" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-max">
          <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
            <PlusIcon />
            OpenAI Compatible
          </DropdownMenuItem>
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
