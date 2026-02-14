import { Loader2Icon, LogInIcon } from "lucide-react";
import type { ReactNode } from "react";

import { CopyButton } from "@/components/a1/copy-button";
import { UserProfileDisplay } from "@/components/a1/web-auth/user-profile-display";
import { Button } from "@/components/ui/button";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { cn } from "@/lib/utils";

interface AuthStatusDisplayProps {
  className?: string;
}

export function AuthStatusDisplay({ className }: AuthStatusDisplayProps) {
  const {
    user,
    isLoading,
    isSigningIn,
    deviceFlow,
    startSignIn,
    cancelSignIn,
    signOut,
  } = useWebAuth();

  if (isLoading) {
    return (
      <StatusRow
        className={className}
        icon={
          <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
        }
        title="Checking status..."
        description="Please wait while we check your account"
      />
    );
  }

  if (isSigningIn && !deviceFlow) {
    return (
      <StatusRow
        className={className}
        icon={<Loader2Icon className="text-primary size-5 animate-spin" />}
        title="Signing in..."
        description="Preparing device authorization"
        action={
          <Button variant="secondary" size="sm" onClick={cancelSignIn}>
            Cancel
          </Button>
        }
      />
    );
  }

  if (isSigningIn && deviceFlow) {
    return (
      <StatusRow
        className={className}
        icon={<Loader2Icon className="text-primary size-5 animate-spin" />}
        title="Link this device"
        description={
          <span className="font-mono font-bold tracking-wider">
            {deviceFlow.userCode}
          </span>
        }
        action={
          <>
            <CopyButton
              text={deviceFlow.userCode}
              size="sm"
              variants={{
                idle: "secondary",
                copying: "secondary",
                success: "secondary",
                error: "secondary",
              }}
            />
            <Button variant="secondary" size="sm" onClick={cancelSignIn}>
              Cancel
            </Button>
          </>
        }
      />
    );
  }

  if (user) {
    return (
      <UserProfileDisplay
        className={className}
        user={user}
        action={
          <Button variant="secondary" size="sm" onClick={signOut}>
            Sign out
          </Button>
        }
      />
    );
  }

  return (
    <StatusRow
      className={className}
      icon={<LogInIcon className="text-muted-foreground size-5" />}
      title="Not signed in"
      description="Sign in to synchronize your data"
      action={
        <Button onClick={startSignIn} size="sm">
          Sign in
        </Button>
      }
    />
  );
}

interface StatusRowProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}

function StatusRow({
  icon,
  title,
  description,
  action,
  className,
}: StatusRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3">
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
          {icon}
        </div>
        <div>
          <p className="leading-none font-medium">{title}</p>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">{action}</div>
    </div>
  );
}
