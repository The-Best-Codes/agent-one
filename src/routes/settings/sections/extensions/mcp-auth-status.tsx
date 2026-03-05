import { useAtomValue } from "jotai";
import {
  CheckCircle2Icon,
  InfoIcon,
  KeyIcon,
  Loader2Icon,
  LogInIcon,
  LogOutIcon,
  ShieldOffIcon,
  XCircleIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { mcpCheckAuth, mcpLogin, mcpLogout } from "@/lib/ai/tools/mcp/oauth";
import { mcpAuthStatesAtom } from "@/lib/jotai/mcp-atoms";
import { type McpHttpServerConfig } from "@/lib/settings/types";

export function McpAuthStatus({
  server,
  disabled,
}: {
  server: McpHttpServerConfig;
  disabled?: boolean;
}) {
  const authStates = useAtomValue(mcpAuthStatesAtom);
  const authState = authStates[server.id];
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authState === undefined && !disabled) {
      void mcpCheckAuth(server.id, server.url);
    }
  }, [server.id, server.url, authState, disabled]);

  const handleLogin = async () => {
    setLoading(true);
    await mcpLogin(server.id, server.url, server.name);
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    await mcpLogout(server.id);
    setLoading(false);
  };

  if (disabled) {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="flex items-center gap-2">
          <InfoIcon className="text-foreground size-5" />
          <span className="text-foreground text-sm">
            Enable server to see auth status
          </span>
        </div>
      </div>
    );
  }

  if (authState === "no-auth") {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="flex items-center gap-2">
          <ShieldOffIcon className="text-foreground size-5" />
          <span className="text-foreground text-sm">
            No authorization required
          </span>
        </div>
      </div>
    );
  }

  if (authState === "supports-oauth") {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="flex items-center gap-2">
          <KeyIcon className="text-foreground size-5" />
          <span className="text-foreground text-sm">
            Login available for full access
          </span>
        </div>
        <Button size="sm" onClick={handleLogin} disabled={loading}>
          {loading ? <Loader2Icon className="animate-spin" /> : <LogInIcon />}
          Login
        </Button>
      </div>
    );
  }

  if (authState === undefined) {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="flex items-center gap-2">
          <Loader2Icon className="text-foreground size-5 animate-spin" />
          <span className="text-foreground text-sm">
            Checking auth status...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-2">
        {authState === "logged-in" ? (
          <>
            <CheckCircle2Icon className="text-foreground size-5" />
            <span className="text-sm">Logged in</span>
          </>
        ) : (
          <>
            <XCircleIcon className="text-foreground size-5" />
            <span className="text-foreground text-sm">Not logged in</span>
          </>
        )}
      </div>
      {authState === "logged-in" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? <Loader2Icon className="animate-spin" /> : <LogOutIcon />}
          Logout
        </Button>
      ) : (
        <Button size="sm" onClick={handleLogin} disabled={loading}>
          {loading ? <Loader2Icon className="animate-spin" /> : <LogInIcon />}
          Login
        </Button>
      )}
    </div>
  );
}
