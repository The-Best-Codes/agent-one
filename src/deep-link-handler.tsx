import { listen } from "@tauri-apps/api/event";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { useAtom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

import deepLinkSchema from "@/assets/deep-links/schema.json";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

const handledDeepLinkAtom = atomWithStorage<string | null>(
  "agent-one-handled-deeplink",
  null,
  createJSONStorage(() => sessionStorage),
  { getOnInit: true },
);

function getDeepLinkVersion(id: string): number | null {
  const deepLink = deepLinkSchema.deepLinks.find((dl) => dl.id === id);
  return deepLink?.version ?? null;
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
        const deepLinkId =
          urlObj.hostname !== "" ? urlObj.hostname : urlObj.pathname.replace(/^\/+/, "");

        const versionParam = urlObj.searchParams.get("v");
        if (versionParam === null) {
          logger.warn(`Deep link ignored: missing version parameter (v) in URL: ${url}`);
          return;
        }

        const urlVersion = parseInt(versionParam, 10);
        if (isNaN(urlVersion)) {
          logger.warn(
            `Deep link ignored: invalid version parameter (v=${versionParam}) in URL: ${url}`,
          );
          return;
        }

        const schemaVersion = getDeepLinkVersion(deepLinkId);
        if (schemaVersion === null) {
          logger.warn(`Deep link ignored: unknown deep link ID "${deepLinkId}" in URL: ${url}`);
          return;
        }

        if (urlVersion !== schemaVersion) {
          logger.warn(
            `Deep link ignored: version mismatch (url: ${urlVersion}, expected: ${schemaVersion}) for "${deepLinkId}" in URL: ${url}`,
          );
          return;
        }

        logger.verbose(`Deep link "${deepLinkId}" parsed successfully`);

        if (deepLinkId === "new-chat") {
          const message = urlObj.searchParams.get("message");
          const params = new URLSearchParams();
          if (message) {
            params.set("initialMessage", message);
          }
          void navigate(`/chat${params.size > 0 ? `?${params.toString()}` : ""}`);
        }
      } catch (error) {
        logger.error("Failed to parse deep link URL:", error);
      }
    };

    void setupDeepLink();
  }, [navigate, handledDeepLink, setHandledDeepLink]);

  return null;
}
