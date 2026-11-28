import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { stopMcpServer } from "@/lib/ai/tools/mcp";
import {
  installMcpBundle,
  type McpBundle,
  McpBundleError,
  readMcpBundle,
} from "@/lib/extensions/mcpb";
import { getInstalledExtensionMetadata } from "@/lib/extensions/metadata";
import { getLogger } from "@/lib/logger";

import { InstallDialog } from "./components/install-dialog";
import { getExtensionPath } from "./model";
import { useExtensionActions } from "./use-extension-actions";

const logger = getLogger(import.meta.url);

export function InstallFromFile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { servers, installServer, restartServer } = useExtensionActions();
  const [bundle, setBundle] = useState<McpBundle>();
  const path = searchParams.get("mcpb");
  const latest = useRef({ servers, navigate, setSearchParams });

  useEffect(() => {
    latest.current = { servers, navigate, setSearchParams };
  }, [servers, navigate, setSearchParams]);

  useEffect(() => {
    if (!path) return;
    let active = true;
    const finish = () =>
      latest.current.setSearchParams(
        (previous) => {
          previous.delete("mcpb");
          return previous;
        },
        { replace: true },
      );

    readMcpBundle(path)
      .then((result) => {
        if (!active) return;
        finish();
        const existing = latest.current.servers.find((server) => server.id === result.id);
        if (
          existing &&
          getInstalledExtensionMetadata(existing)?.version === result.metadata.version
        ) {
          toast.info(`${existing.name || result.metadata.displayName} is already installed`);
          void latest.current.navigate(getExtensionPath(existing.id));
          return;
        }
        setBundle(result);
      })
      .catch((error) => {
        if (!active) return;
        logger.warn("Failed to open extension file", error);
        toast.error(
          error instanceof McpBundleError ? error.message : "Couldn't open that extension file.",
          { description: error instanceof McpBundleError ? undefined : String(error) },
        );
        finish();
      });

    return () => {
      active = false;
    };
  }, [path]);

  return (
    <InstallDialog
      installKey={bundle ? `${bundle.path}:${bundle.metadata.version}` : undefined}
      name={bundle?.metadata.displayName ?? ""}
      templates={bundle ? [bundle.template] : []}
      untrusted
      open={Boolean(bundle)}
      onOpenChange={(open) => {
        if (!open) setBundle(undefined);
      }}
      onInstall={(result) => {
        if (!bundle) return;
        const existed = servers.some((server) => server.id === bundle.id);
        const toastId = toast.loading(`Installing ${result.name}...`);
        (existed ? stopMcpServer(bundle.id) : Promise.resolve())
          .then(() => installMcpBundle(bundle))
          .then(() => {
            toast.dismiss(toastId);
            const server = installServer(result, { id: bundle.id, metadata: bundle.metadata });
            if (existed) restartServer(server.id);
            void navigate(getExtensionPath(server.id));
          })
          .catch((error) => {
            logger.error("Failed to install extension file", error);
            if (existed) restartServer(bundle.id);
            toast.error(`Couldn't install ${result.name}`, {
              id: toastId,
              description: error instanceof McpBundleError ? error.message : String(error),
            });
          });
      }}
    />
  );
}
