import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { setMcpOAuthClient } from "@/lib/ai/tools/mcp/oauth";
import {
  createManifestMetadata,
  type ExtensionManifest,
  ExtensionNotFoundError,
  fetchExtensionManifest,
} from "@/lib/extensions/manifest";
import { getLogger } from "@/lib/logger";

import { InstallDialog } from "./components/install-dialog";
import { getExtensionPath } from "./model";
import { useExtensionActions } from "./use-extension-actions";

const logger = getLogger(import.meta.url);

export function InstallFromLink() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { servers, installServer } = useExtensionActions();
  const [manifest, setManifest] = useState<ExtensionManifest>();
  const id = searchParams.get("install");
  const inPlace = Boolean(useLocation().state?.inPlace);
  const latest = useRef({ servers, navigate, setSearchParams, inPlace });

  useEffect(() => {
    latest.current = { servers, navigate, setSearchParams, inPlace };
  }, [servers, navigate, setSearchParams, inPlace]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    let loading = true;
    const toastId = toast.loading("Getting extension details...");
    const finish = () => {
      loading = false;
      latest.current.setSearchParams(
        (previous) => {
          previous.delete("install");
          return previous;
        },
        { replace: true },
      );
    };

    fetchExtensionManifest(id)
      .then((result) => {
        if (!active) return;
        const existing = latest.current.servers.find((server) => server.id === result.serverId);
        if (existing) {
          const { inPlace, navigate } = latest.current;
          loading = false;
          toast.info(`${existing.name || result.name} is already installed`, { id: toastId });
          if (inPlace) finish();
          void navigate(getExtensionPath(existing.id), { replace: !inPlace });
          return;
        }
        if (!result.templates.length) {
          toast.error(`${result.name} uses a connection type AgentOne doesn't support yet.`, {
            id: toastId,
          });
          finish();
          return;
        }
        toast.dismiss(toastId);
        setManifest(result);
        finish();
      })
      .catch((error) => {
        if (!active) return;
        logger.warn("Failed to load extension from link", error);
        toast.error(
          error instanceof ExtensionNotFoundError
            ? "That extension couldn't be found. It may have been removed."
            : "Couldn't load that extension. Check your connection and try again.",
          { id: toastId },
        );
        finish();
      });

    return () => {
      active = false;
      if (loading) toast.dismiss(toastId);
    };
  }, [id]);

  const notes = manifest
    ? [
        manifest.reviewed
          ? undefined
          : "This extension comes from the community and hasn't been reviewed by AgentOne.",
      ].filter((note): note is string => Boolean(note))
    : [];

  return (
    <InstallDialog
      installKey={manifest?.id}
      name={manifest?.name ?? ""}
      templates={manifest?.templates ?? []}
      notes={notes}
      signInAfterInstall={manifest?.signIn === "required"}
      oauthClient={manifest?.oauthClient}
      open={Boolean(manifest)}
      onOpenChange={(open) => {
        if (!open) setManifest(undefined);
      }}
      onInstall={async (result, template, oauthClient) => {
        if (!manifest) return;
        if (oauthClient) {
          try {
            await setMcpOAuthClient(
              manifest.serverId,
              oauthClient.clientId,
              oauthClient.clientSecret,
            );
          } catch (error) {
            logger.error("Failed to save OAuth client", error);
            toast.error("Couldn't save the client ID. You can add it in the extension's settings.");
          }
        }
        const server = installServer(result, {
          id: manifest.serverId,
          metadata: createManifestMetadata(manifest, template),
        });
        void navigate(getExtensionPath(server.id));
      }}
    />
  );
}
