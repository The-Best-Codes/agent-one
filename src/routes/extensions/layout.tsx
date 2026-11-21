import { IconArrowLeft } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setMcpOAuthClient } from "@/lib/ai/tools/mcp/oauth";

import { AddServerDialog } from "./add-server-dialog";
import { InstallFromLink } from "./install-from-link";
import { getExtensionPath, useExtensionsLink } from "./model";
import { useExtensionActions } from "./use-extension-actions";

export default function ExtensionsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const link = useExtensionsLink();
  const { installServer, restartServer } = useExtensionActions();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const installedRef = useRef(false);
  const openAddDialog = useCallback(() => setShowAddDialog(true), []);
  const chatId = searchParams.get("chatId");

  const prefill = useMemo(() => {
    const name = searchParams.get("mcpName");
    const type = searchParams.get("mcpType");
    if (!name || (type !== "stdio" && type !== "http")) return null;
    return {
      name,
      type,
      command: searchParams.get("mcpCommand") ?? undefined,
      url: searchParams.get("mcpUrl") ?? undefined,
    } as const;
  }, [searchParams]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <main className="flex h-svh min-h-0 flex-col" role="main">
      <header className="bg-background z-10 flex items-center gap-3 border-b p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void navigate(chatId ? `/chat/${chatId}` : "/chat")}
        >
          <IconArrowLeft data-icon="inline-start" />
          Back
        </Button>
        <h1 className="text-base font-semibold">Extensions</h1>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
          <Outlet context={openAddDialog} />
        </div>
      </div>

      <AddServerDialog
        key={prefill ? "deeplink" : "manual"}
        open={showAddDialog || Boolean(prefill)}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          const installed = installedRef.current;
          installedRef.current = false;
          if (!open && prefill && !installed) {
            setSearchParams(
              (previous) => {
                for (const key of ["mcpName", "mcpType", "mcpCommand", "mcpUrl"]) {
                  previous.delete(key);
                }
                return previous;
              },
              { replace: true },
            );
          }
        }}
        onAddServer={({ oauthClient, ...data }) => {
          const server = installServer(
            data.type === "stdio"
              ? { ...data, type: "stdio", command: data.command ?? "", env: data.env ?? {} }
              : { ...data, type: "http", url: data.url ?? "", headers: data.headers ?? {} },
          );
          if (oauthClient) {
            setMcpOAuthClient(server.id, oauthClient.clientId, oauthClient.clientSecret)
              .catch((error) => toast.error(`Couldn't save the OAuth app: ${String(error)}`))
              .finally(() => restartServer(server.id));
          }
          installedRef.current = true;
          void navigate(link(getExtensionPath(server.id)), { replace: Boolean(prefill) });
        }}
        initialValues={prefill}
      />

      <InstallFromLink />
    </main>
  );
}
