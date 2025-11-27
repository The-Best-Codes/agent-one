import { listen } from "@tauri-apps/api/event";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

export function DeepLinkHandler() {
  const navigate = useNavigate();
  const initialDeepLinkHandledRef = useRef(false);

  useEffect(() => {
    const setupDeepLink = async () => {
      try {
        const currentUrls = await getCurrent();
        if (
          currentUrls &&
          currentUrls.length > 0 &&
          !initialDeepLinkHandledRef.current
        ) {
          initialDeepLinkHandledRef.current = true;
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
        console.error("Failed to setup deep link handler:", error);
      }
    };

    const handleDeepLink = (url: string) => {
      try {
        const urlObj = new URL(url);

        if (
          urlObj.hostname === "new-chat" ||
          urlObj.pathname === "//new-chat"
        ) {
          const message = urlObj.searchParams.get("message");
          const params = new URLSearchParams();
          if (message) {
            params.set("initialMessage", message);
          }
          navigate(`/chat${params.size > 0 ? `?${params.toString()}` : ""}`);
        }
      } catch (error) {
        console.error("Failed to parse deep link URL:", error);
      }
    };

    setupDeepLink();
  }, [navigate]);

  return null;
}
