import { ChevronDownIcon, ClockIcon, DownloadIcon, RocketIcon } from "lucide-react";
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
            <RocketIcon className="text-primary size-5" />
            <DialogTitle>Update Available</DialogTitle>
          </div>
          <DialogDescription>
            AgentOne v{updateVersion} is available. Update now to get the latest features and bug
            fixes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <ButtonGroup>
            <Button variant="outline" size="sm" onClick={() => handleRemind(1)}>
              <ClockIcon data-icon="inline-start" />
              Remind me in 1 day
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm">
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-max">
                <DropdownMenuItem onClick={() => handleRemind(3)}>
                  Remind me in 3 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRemind(7)}>
                  Remind me in 1 week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRemind(14)}>
                  Remind me in 2 weeks
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
            <DownloadIcon data-icon="inline-start" />
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
