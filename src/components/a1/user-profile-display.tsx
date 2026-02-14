import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { WebAuthUser } from "@/contexts/use-web-auth/web-auth-contexts";

interface UserProfileDisplayProps {
  user: WebAuthUser;
  action?: ReactNode;
}

export function UserProfileDisplay({ user, action }: UserProfileDisplayProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Avatar size="lg" className="rounded-md">
          <AvatarImage src={user.image ?? undefined} alt={user.name} />
          <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="leading-none font-medium">{user.name}</p>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
