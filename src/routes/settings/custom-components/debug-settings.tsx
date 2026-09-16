import { IconBug } from "@tabler/icons-react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";

export default function DebugSettings() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
          <IconBug className="text-muted-foreground size-5" />
        </div>
        <div>
          <p className="leading-none font-medium">Internal Tests</p>
          <p className="text-muted-foreground text-sm">
            Access internal testing tools and utilities.
          </p>
        </div>
      </div>
      <Button onClick={() => navigate("/tests")} size="sm">
        Open Tests
      </Button>
    </div>
  );
}
