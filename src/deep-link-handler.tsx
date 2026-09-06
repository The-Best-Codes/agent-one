import { listen } from "@tauri-apps/api/event";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { useAtom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import deepLinkSchema from "@/assets/deep-links/schema.json";
import { getCronInvocation } from "@/lib/cron";
import i18n from "@/lib/i18n";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

const handledDeepLinkAtom = atomWithStorage<string | null>(
  "agent-one-handled-deeplink",
  null,
  createJSONStorage(() => sessionStorage),
  { getOnInit: true },
);

function getDeepLinkMeta(id: string): { version: number; allowNoVersion: boolean } | null {
  const deepLink = deepLinkSchema.deepLinks.find((dl) => dl.id === id);
  if (!deepLink) return null;
  return {
    version: deepLink.version,
    allowNoVersion: "dangerouslyAllowNoVersion" in deepLink && !!deepLink.dangerouslyAllowNoVersion,
  };
}

export function DeepLinkHandler() {
  const navigate = useNavigate();
  const initialDeepLinkHandledRef = useRef(false);
  const [handledDeepLink, setHandledDeepLink] = useAtom(handledDeepLinkAtom);

  useEffect(() => {
    const setupDeepLink = async () => {
      try {
        const currentUrls = await getCurrent();
        if (
          currentUrls &&
          currentUrls.length > 0 &&
          !initialDeepLinkHandledRef.current &&
          currentUrls[0] !== handledDeepLink
        ) {
          initialDeepLinkHandledRef.current = true;
          setHandledDeepLink(currentUrls[0]);
          handleDeepLink(currentUrls[0]);
        }

        await onOpenUrl((urls: string[]) => {
          if (urls.length > 0) {
            handleDeepLink(urls[0]);
          }
        });

        await listen<string>("tauri://deep-link", (event) => {
          handleDeepLink(event.payload);
        });
      } catch (error) {
        logger.warn("Failed to setup deep link handler:", error);
      }
    };

    const handleDeepLink = (url: string) => {
      try {
        const urlObj = new URL(url);
        const deepLinkId = [urlObj.hostname, urlObj.pathname.replace(/^\/+/, "")]
          .filter(Boolean)
          .join("/");

        const meta = getDeepLinkMeta(deepLinkId);
        if (meta === null) {
          logger.warn(`Deep link ignored: unknown deep link ID "${deepLinkId}" in URL: ${url}`);
          return;
        }

        const versionParam = urlObj.searchParams.get("v");
        if (versionParam === null && !meta.allowNoVersion) {
          logger.warn(`Deep link ignored: missing version parameter (v) in URL: ${url}`);
          return;
        }

        if (versionParam !== null) {
          const urlVersion = parseInt(versionParam, 10);
          if (isNaN(urlVersion)) {
            logger.warn(
              `Deep link ignored: invalid version parameter (v=${versionParam}) in URL: ${url}`,
            );
            return;
          }

          if (urlVersion !== meta.version) {
            logger.warn(
              `Deep link ignored: version mismatch (url: ${urlVersion}, expected: ${meta.version}) for "${deepLinkId}" in URL: ${url}`,
            );
            return;
          }
        }

        logger.verbose(`Deep link "${deepLinkId}" parsed successfully`);

        if (deepLinkId === "new-chat") {
          const message = urlObj.searchParams.get("message");
          const params = new URLSearchParams();
          if (message) {
            params.set("initialMessage", message);
          }
          void navigate(`/chat${params.size > 0 ? `?${params.toString()}` : ""}`);
        } else if (deepLinkId === "mcp/install") {
          const name = urlObj.searchParams.get("name");
          const configParam = urlObj.searchParams.get("config");
          if (!name || !configParam) {
            logger.warn("Deep link mcp/install missing required name or config parameter");
            return;
          }

          let config: { type?: string; command?: string; args?: string[]; url?: string };
          try {
            config = JSON.parse(decodeURIComponent(configParam));
          } catch {
            logger.warn("Deep link mcp/install has invalid config JSON");
            return;
          }

          const serverType = config.type === "http" ? "http" : "stdio";
          const params = new URLSearchParams({
            tab: "extensions",
            mcpName: name,
            mcpType: serverType,
          });
          if (serverType === "stdio") {
            const command = [config.command, ...(config.args ?? [])].filter(Boolean).join(" ");
            if (command) params.set("mcpCommand", command);
          } else if (config.url) {
            params.set("mcpUrl", config.url);
          }

          void navigate(`/settings?${params.toString()}`);
        } else if (deepLinkId === "cron") {
          const id = urlObj.searchParams.get("id");
          if (!id) {
            logger.warn("Cron deep link is missing the required id parameter");
            return;
          }

          void getCronInvocation(id)
            .then((invocation) => {
              if (!invocation) return;
              toast(i18n.t("tests.cronInvoked", { id: invocation.id }), {
                description: i18n.t("tests.cronInvocationDescription", {
                  message: invocation.message ?? i18n.t("tests.noCronMessage"),
                  delay: invocation.delaySeconds,
                }),
              });
            })
            .catch((error) => {
              logger.error("Failed to handle cron invocation:", error);
            });
        }
      } catch (error) {
        logger.error("Failed to parse deep link URL:", error);
      }
    };

    void setupDeepLink();
  }, [navigate, handledDeepLink, setHandledDeepLink]);

  return null;
}
