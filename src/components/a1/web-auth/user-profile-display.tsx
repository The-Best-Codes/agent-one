import Avatar from "boring-avatars";
import type { ReactNode } from "react";

import type { WebAuthUser } from "@/contexts/use-web-auth/web-auth-contexts";
import { cn } from "@/lib/utils";

interface UserProfileDisplayProps {
  user: WebAuthUser;
  action?: ReactNode;
  className?: string;
}

export function UserProfileDisplay({ user, action, className }: UserProfileDisplayProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3">
        <div className="size-10 overflow-hidden rounded-lg">
          <Avatar size={40} name={user.id} variant="beam" square />
        </div>
        <div>
          <p className="leading-none font-medium">{user.name}</p>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
