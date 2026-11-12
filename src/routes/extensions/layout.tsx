import { IconArrowLeft, IconPlus } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";

import { AddServerDialog } from "./add-server-dialog";
import { InstallFromLink } from "./install-from-link";
import { getExtensionPath, useExtensionsLink } from "./model";
import { useExtensionActions } from "./use-extension-actions";

export default function ExtensionsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const link = useExtensionsLink();
  const { installServer } = useExtensionActions();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatId = searchParams.get("chatId");
  const isList = location.pathname === "/extensions";

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
      <header className="bg-background z-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-b p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void navigate(chatId ? `/chat/${chatId}` : "/chat")}
        >
          <IconArrowLeft data-icon="inline-start" />
          Back
        </Button>
        <h1 className="text-base font-semibold">
          {isList ? (
            "Extensions"
          ) : (
            <Link
              to={link("/extensions")}
              className="focus-visible:ring-ring/50 rounded-sm outline-none hover:underline focus-visible:ring-3"
            >
              Extensions
            </Link>
          )}
        </h1>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => setShowAddDialog(true)}
        >
          <IconPlus data-icon="inline-start" />
          Add custom
        </Button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
          <Outlet />
        </div>
      </div>

      <AddServerDialog
        key={prefill ? "deeplink" : "manual"}
        open={showAddDialog || Boolean(prefill)}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open && prefill) {
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
        onAddServer={(data) => {
          const server = installServer(
            data.type === "stdio"
              ? { ...data, type: "stdio", command: data.command ?? "", env: data.env ?? {} }
              : { ...data, type: "http", url: data.url ?? "", headers: data.headers ?? {} },
          );
          void navigate(link(getExtensionPath(server.id)));
        }}
        initialValues={prefill}
      />

      <InstallFromLink />
    </main>
  );
}
