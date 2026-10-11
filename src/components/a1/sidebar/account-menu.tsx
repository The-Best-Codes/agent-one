import {
  IconClock,
  IconCreditCard,
  IconExternalLink,
  IconLogin,
  IconLogout,
  IconPuzzle,
  IconRocket,
  IconSelector,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import BoringAvatar from "boring-avatars";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getActivePaidSubscription,
  getPlanNameForSubscription,
} from "@/contexts/use-web-auth/web-auth-contexts";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import {
  AGENT_ONE_BILLING_URL,
  AGENT_ONE_DASHBOARD_URL,
  AGENT_ONE_UPGRADE_URL,
} from "@/lib/constants";

import { SettingsLink } from "../settings-link";
import { SignOutModal } from "./modals";

export function AccountMenu({ activeChatId }: { activeChatId?: string }) {
  const { user, isLoading, customerState, billingError } = useWebAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const activeSubscription = useMemo(
    () => getActivePaidSubscription(customerState),
    [customerState],
  );

  const chatQuery = activeChatId ? `?chatId=${activeChatId}` : "";

  let triggerContent: ReactNode;
  if (user) {
    triggerContent = (
      <TriggerRow
        icon={
          <BoringAvatar name={user.id} variant="beam" square className="size-full rounded-lg" />
        }
        title={user.name}
        description={
          customerState ? (
            `${getPlanNameForSubscription(activeSubscription)} Plan`
          ) : billingError ? (
            user.email
          ) : (
            <Skeleton className="h-3 w-16" />
          )
        }
      />
    );
  } else if (isLoading) {
    triggerContent = (
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-lg" />
        <div className="flex flex-col gap-0.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  } else {
    triggerContent = (
      <TriggerRow
        icon={<IconUser className="text-muted-foreground" />}
        title="Not signed in"
        description="Sign in to sync your data"
      />
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto w-full justify-start p-1.5">
            {triggerContent}
            <IconSelector className="text-muted-foreground ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top">
          {user ? (
            <>
              <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
              <DropdownMenuGroup>
                {customerState && (
                  <DropdownMenuItem asChild>
                    <a
                      href={activeSubscription ? AGENT_ONE_BILLING_URL : AGENT_ONE_UPGRADE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {activeSubscription ? <IconCreditCard /> : <IconRocket />}
                      {activeSubscription ? "Manage Billing" : "Upgrade Your Plan"}
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <a href={AGENT_ONE_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
                    <IconExternalLink />
                    Account Dashboard
                  </a>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          ) : (
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <SettingsLink id="setting-account">
                  <IconLogin />
                  Sign In
                </SettingsLink>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to={`/extensions${chatQuery}`}>
                <IconPuzzle />
                Extensions
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/scheduled-agents${chatQuery}`}>
                <IconClock />
                Scheduled Agents
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <SettingsLink>
                <IconSettings />
                Settings
              </SettingsLink>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {user && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setShowSignOutModal(true)}>
                <IconLogout />
                Sign Out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <SignOutModal isOpen={showSignOutModal} onClose={() => setShowSignOutModal(false)} />
    </>
  );
}

function TriggerRow({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar>
        <AvatarFallback>{icon}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col items-start gap-0.5 text-left">
        <span className="w-full truncate text-sm leading-none font-medium">{title}</span>
        <span className="text-muted-foreground w-full truncate text-xs leading-none">
          {description}
        </span>
      </div>
    </div>
  );
}
