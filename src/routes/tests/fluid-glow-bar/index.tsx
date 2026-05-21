import { IconArrowLeft } from "@tabler/icons-react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  LogicalPosition,
  LogicalSize,
  primaryMonitor,
} from "@tauri-apps/api/window";
import { useState } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

const WINDOW_LABEL = "fluid-glow-bar";
const WINDOW_HEIGHT = 20;

export default function FluidGlowBarTestRoute() {
  const navigate = useNavigate();
  const [isLaunching, setIsLaunching] = useState(false);

  const launch = async () => {
    setIsLaunching(true);
    try {
      const existing = await WebviewWindow.getByLabel(WINDOW_LABEL);
      if (existing) {
        await existing.close();
      }

      const monitor = await primaryMonitor();
      const scale = monitor?.scaleFactor ?? 1;
      const monitorX = monitor ? monitor.position.x / scale : 0;
      const monitorY = monitor ? monitor.position.y / scale : 0;
      const monitorWidth = monitor
        ? monitor.size.width / scale
        : window.screen.width;
      const monitorHeight = monitor
        ? monitor.size.height / scale
        : window.screen.height;
      const targetX = monitorX;
      const targetY = monitorY + monitorHeight - WINDOW_HEIGHT;

      const webview = new WebviewWindow(WINDOW_LABEL, {
        url: "/fluid-glow-bar.html",
        title: "Fluid Glow Bar",
        width: monitorWidth,
        minHeight: WINDOW_HEIGHT,
        height: WINDOW_HEIGHT,
        x: targetX,
        y: targetY,
        transparent: true,
        decorations: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        focus: false,
        shadow: false,
      });

      webview.once("tauri://created", () => {
        void (async () => {
          try {
            await webview.setSize(new LogicalSize(monitorWidth, WINDOW_HEIGHT));
            await webview.setPosition(new LogicalPosition(targetX, targetY));
            await webview.setIgnoreCursorEvents(true);
          } catch (error) {
            logger.error("Failed to configure fluid glow bar window", {
              error,
            });
          }
        })();
      });
      webview.once("tauri://error", (error) => {
        logger.error("Failed to create fluid glow bar window", { error });
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const close = async () => {
    const existing = await WebviewWindow.getByLabel(WINDOW_LABEL);
    if (existing) {
      await existing.close();
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/tests")}
            className="gap-2"
          >
            <IconArrowLeft data-icon="inline-start" />
            Back to Tests
          </Button>
          <h1 className="text-2xl font-bold">Fluid Glow Bar Test</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fluid Glow Bar Window</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Launches a transparent, click-through window pinned to the bottom
              of the primary monitor that renders the fluid glow bar shader.
            </p>
            <div className="flex gap-2">
              <Button onClick={launch} disabled={isLaunching}>
                Launch
              </Button>
              <Button onClick={close} variant="outline">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
