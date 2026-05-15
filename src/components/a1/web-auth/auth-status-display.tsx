import { IconExternalLink, IconUser } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { CopyButton } from "@/components/a1/copy-button";
import { UserProfileDisplay } from "@/components/a1/web-auth/user-profile-display";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { cn } from "@/lib/utils";

interface AuthStatusDisplayProps {
  className?: string;
  signedInAction?: ReactNode;
}

export function AuthStatusDisplay({ className, signedInAction }: AuthStatusDisplayProps) {
  const {
    user,
    isLoading,
    isSigningIn,
    isSigningOut,
    deviceFlow,
    startSignIn,
    cancelSignIn,
    signOut,
  } = useWebAuth();

  if (isLoading) {
    return (
      <StatusRow
        className={className}
        icon={<Spinner className="text-muted-foreground" data-icon="inline-start" />}
        title="Checking status..."
        description="Please wait while we check your account"
      />
    );
  }

  if (isSigningIn && !deviceFlow) {
    return (
      <StatusRow
        className={className}
        icon={<Spinner className="text-primary" data-icon="inline-start" />}
        title="Signing in..."
        description="Getting you signed in..."
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
        icon={<Spinner className="text-primary" data-icon="inline-start" />}
        title="Link your account"
        description={
          <a
            href={deviceFlow.verificationUriComplete || deviceFlow.verificationUri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-row items-center justify-center gap-1 hover:underline"
          >
            Open Login Form Manually
            <IconExternalLink className="size-4" />
          </a>
        }
        action={
          <>
            <div className="bg-secondary flex flex-row items-center justify-center rounded-md pl-2">
              <span className="font-mono text-sm leading-none font-bold tracking-wider">
                {deviceFlow.userCode}
              </span>
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
            </div>
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
          signedInAction ?? (
            <Button variant="secondary" size="sm" onClick={signOut} disabled={isSigningOut}>
              {isSigningOut && <Spinner data-icon="inline-start" />}
              Sign out
            </Button>
          )
        }
      />
    );
  }

  return (
    <StatusRow
      className={className}
      icon={<IconUser className="text-muted-foreground size-5" />}
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

function StatusRow({ icon, title, description, action, className }: StatusRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3">
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
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
