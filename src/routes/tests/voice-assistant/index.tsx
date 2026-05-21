import { IconArrowLeft, IconMicrophone, IconPlayerStop } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { primaryMonitor } from "@tauri-apps/api/window";
import { useEffect, useEffectEvent, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const WINDOW_LABEL = "fluid-glow-bar";
const WINDOW_HEIGHT = 200;
const EVENT_NAME = "voice-assistant-test://state";
let currentGlowBarWsUrl: string | null = null;

type VoiceAssistantSnapshot = {
  running: boolean;
  phase: string;
  status: string;
  transcript: string;
  finalTranscript: string | null;
  wsUrl: string | null;
  error: string | null;
  activated: boolean;
};

async function openGlowBar(wsUrl: string) {
  const existing = await WebviewWindow.getByLabel(WINDOW_LABEL);
  if (existing && currentGlowBarWsUrl === wsUrl) {
    return existing;
  }
  if (existing) {
    await existing.close();
  }

  currentGlowBarWsUrl = wsUrl;

  const monitor = await primaryMonitor();
  const scale = monitor?.scaleFactor ?? 1;
  const monitorX = monitor ? monitor.position.x / scale : 0;
  const monitorY = monitor ? monitor.position.y / scale : 0;
  const monitorWidth = monitor ? monitor.size.width / scale : window.screen.width;
  const monitorHeight = monitor ? monitor.size.height / scale : window.screen.height;
  const targetY = monitorY + monitorHeight - WINDOW_HEIGHT;

  const webview = new WebviewWindow(WINDOW_LABEL, {
    url: `/fluid-glow-bar.html?ws=${encodeURIComponent(wsUrl)}`,
    title: "Voice Assistant Glow Bar",
    width: monitorWidth,
    height: WINDOW_HEIGHT,
    minWidth: 1,
    minHeight: 1,
    x: monitorX,
    y: targetY,
    transparent: true,
    decorations: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focus: false,
    shadow: false,
  });

  webview.once("tauri://created", () => {
    void webview.setIgnoreCursorEvents(true);
  });

  return webview;
}

async function closeGlowBar() {
  const existing = await WebviewWindow.getByLabel(WINDOW_LABEL);
  if (existing) {
    await existing.close();
  }
  currentGlowBarWsUrl = null;
}

export default function VoiceAssistantTestRoute() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<VoiceAssistantSnapshot | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const syncOverlay = useEffectEvent(async (nextSnapshot: VoiceAssistantSnapshot) => {
    if (nextSnapshot.activated && nextSnapshot.wsUrl) {
      await openGlowBar(nextSnapshot.wsUrl);
      return;
    }

    await closeGlowBar();
  });

  useEffect(() => {
    let mounted = true;

    void invoke<VoiceAssistantSnapshot>("get_voice_assistant_test_state").then((nextSnapshot) => {
      if (!mounted) {
        return;
      }

      setSnapshot(nextSnapshot);
      void syncOverlay(nextSnapshot);
    });

    const unlistenPromise = listen<VoiceAssistantSnapshot>(EVENT_NAME, ({ payload }) => {
      setSnapshot(payload);
      void syncOverlay(payload);
    });

    return () => {
      mounted = false;
      void closeGlowBar();
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const start = async () => {
    setIsStarting(true);
    try {
      const nextSnapshot = await invoke<VoiceAssistantSnapshot>("start_voice_assistant_test");
      setSnapshot(nextSnapshot);
      if (nextSnapshot.error) {
        toast.error(nextSnapshot.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsStarting(false);
    }
  };

  const stop = async () => {
    setIsStopping(true);
    try {
      const nextSnapshot = await invoke<VoiceAssistantSnapshot>("stop_voice_assistant_test");
      setSnapshot(nextSnapshot);
      await closeGlowBar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/tests")} className="gap-2">
            <IconArrowLeft data-icon="inline-start" />
            Back to Tests
          </Button>
          <h1 className="text-2xl font-bold">Voice Assistant Test</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Wake Word + Glow Bar</CardTitle>
              <CardDescription>
                Keeps the microphone open in the background, waits for wake word variants like
                "agent 1" or "agent tone", then opens the enlarged glow bar and streams the
                recognized request text into it over a websocket.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button onClick={start} disabled={isStarting || snapshot?.running}>
                  <IconMicrophone data-icon="inline-start" />
                  Start Background Listening
                </Button>
                <Button
                  onClick={stop}
                  variant="outline"
                  disabled={isStopping || !snapshot?.running}
                >
                  <IconPlayerStop data-icon="inline-start" />
                  Stop
                </Button>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-sm">Status</p>
                <p className="mt-1 font-medium">{snapshot?.status ?? "Not listening"}</p>
                {snapshot?.error ? (
                  <p className="mt-2 text-sm text-red-500">{snapshot.error}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recognized Request</CardTitle>
              <CardDescription>
                When you stop speaking after the wake word, the glow bar closes and the captured
                request appears here.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-medium">
                Once fully implemented, this text would be submitted to AgentOne:
              </p>
              <div className="bg-muted/40 min-h-32 rounded-md border p-4 text-sm leading-6 break-words whitespace-pre-wrap">
                {snapshot?.finalTranscript?.trim() || "No completed request captured yet."}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
