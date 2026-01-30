import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NewCustomProviderData } from "@/lib/jotai/custom-provider-atoms";

import { AddOpenAICompatibleDialog } from "./add-openai-compatible-dialog";

interface AddProviderDropdownProps {
  onAddProvider: (data: NewCustomProviderData) => void;
}

export function AddProviderDropdown({
  onAddProvider,
}: AddProviderDropdownProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Add Provider
            <ChevronDownIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
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
