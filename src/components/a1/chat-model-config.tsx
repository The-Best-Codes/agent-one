import { Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const ChatModelConfig = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Model configuration">
          <Settings2Icon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">Stuff will go here.</PopoverContent>
    </Popover>
  );
};
