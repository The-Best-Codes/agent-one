import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { WebAuthUser } from "@/contexts/use-web-auth/web-auth-contexts";

interface UserProfileDisplayProps {
  user: WebAuthUser;
}

export function UserProfileDisplay({ user }: UserProfileDisplayProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-12">
        <AvatarImage src={user.image ?? undefined} alt={user.name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-foreground text-sm font-medium">{user.name}</span>
        <span className="text-muted-foreground text-sm">{user.email}</span>
      </div>
    </div>
  );
}
