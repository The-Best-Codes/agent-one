import { IconArrowLeft, IconMessage2Plus } from "@tabler/icons-react";
import { generateId, type UIMessage } from "ai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";

const USER_BASE_SENTENCE =
  "Please help me think through this request carefully, keep track of the constraints, and respond with enough detail to stress the chat message renderer.";
const ASSISTANT_BASE_SENTENCE =
  "Here is a detailed response with multiple paragraphs, structured explanation, filler detail, and repeated elaboration so the resulting chat exercises dynamic message heights and rendering cost.";
const REASONING_BASE_SENTENCE =
  "Internal reasoning summary placeholder content to create additional collapsible dynamic-height blocks inside assistant messages.";

function repeatParagraphs(seed: string, count: number, prefix: string): string {
  return Array.from({ length: count }, (_, index) => `${prefix} ${index + 1}. ${seed}`).join(
    "\n\n",
  );
}

function clampPositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
}

function createStressMessages({
  includeReasoning,
  messagePairs,
  paragraphsPerAssistantMessage,
  paragraphsPerUserMessage,
}: {
  includeReasoning: boolean;
  messagePairs: number;
  paragraphsPerAssistantMessage: number;
  paragraphsPerUserMessage: number;
}): UIMessage[] {
  return Array.from({ length: messagePairs * 2 }, (_, index) => {
    const isUser = index % 2 === 0;
    const pairNumber = Math.floor(index / 2) + 1;
    const id = generateId();

    if (isUser) {
      return {
        id,
        role: "user",
        parts: [
          {
            type: "text",
            text: repeatParagraphs(
              USER_BASE_SENTENCE,
              paragraphsPerUserMessage,
              `Stress test user message ${pairNumber}`,
            ),
            state: "done",
          },
        ],
      } satisfies UIMessage;
    }

    return {
      id,
      role: "assistant",
      parts: [
        ...(includeReasoning
          ? [
              {
                type: "reasoning" as const,
                text: repeatParagraphs(
                  REASONING_BASE_SENTENCE,
                  Math.max(1, Math.ceil(paragraphsPerAssistantMessage / 2)),
                  `Stress reasoning ${pairNumber}`,
                ),
                state: "done" as const,
              },
              { type: "step-start" as const },
            ]
          : []),
        {
          type: "text",
          text: repeatParagraphs(
            ASSISTANT_BASE_SENTENCE,
            paragraphsPerAssistantMessage,
            `Stress assistant message ${pairNumber}`,
          ),
          state: "done",
        },
      ],
    } satisfies UIMessage;
  });
}

export default function ChatStressTestRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    createChat,
    getNewChatModelConfig,
    getNewChatModelId,
    saveChat,
    saveChatTitle,
    loadChatMessages,
  } = usePersistence();

  const [title, setTitle] = useState("Virtualization Stress Chat");
  const [messagePairs, setMessagePairs] = useState(200);
  const [paragraphsPerUserMessage, setParagraphsPerUserMessage] = useState(1);
  const [paragraphsPerAssistantMessage, setParagraphsPerAssistantMessage] = useState(4);
  const [includeReasoning, setIncludeReasoning] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const totalMessages = messagePairs * 2;

  const handleCreate = async () => {
    if (isCreating) {
      return;
    }

    const normalizedPairs = clampPositiveInteger(messagePairs, 200);
    const normalizedUserParagraphs = clampPositiveInteger(paragraphsPerUserMessage, 1);
    const normalizedAssistantParagraphs = clampPositiveInteger(paragraphsPerAssistantMessage, 4);
    const trimmedTitle = title.trim() || `Stress Chat ${normalizedPairs * 2} messages`;
    const modelId = getNewChatModelId() || "openrouter/auto";

    setIsCreating(true);

    try {
      const chatId = createChat(modelId, getNewChatModelConfig());
      const messages = createStressMessages({
        includeReasoning,
        messagePairs: normalizedPairs,
        paragraphsPerAssistantMessage: normalizedAssistantParagraphs,
        paragraphsPerUserMessage: normalizedUserParagraphs,
      });

      saveChatTitle({ chatId, title: trimmedTitle });
      saveChat({ chatId, messages }); // this is fire-and-forget, which is why the logic below exists

      // 5 times, with a 1 second delay, try to load the chat messages. If there are any, proceed, if there aren't after 5 tries, throw an error.
      let loadedMessages: UIMessage[] = [];
      for (let i = 0; i < 5; i++) {
        loadedMessages = await loadChatMessages(chatId);
        if (loadedMessages.length > 0) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (loadedMessages.length === 0) {
        throw new Error("Failed to load chat messages after 5 tries.");
      }

      toast.success(t("tests.createdStressChat", { count: messages.length.toLocaleString() }));
      await navigate(`/chat/${chatId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t("tests.failedStressChat", { message }));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/tests")} className="gap-2">
            <IconArrowLeft data-icon="inline-start" />
            {t("tests.backToTests")}
          </Button>
          <h1 className="text-2xl font-bold">{t("tests.chatStressTest")}</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("tests.generateStressChat")}</CardTitle>
              <CardDescription>
                Create a realistic large chat and jump straight into it to test chat rendering,
                scrolling, and virtualization thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="stress-chat-title">Chat Title</Label>
                  <Input
                    id="stress-chat-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Virtualization Stress Chat"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="stress-chat-pairs">User/Assistant Pairs</Label>
                  <Input
                    id="stress-chat-pairs"
                    type="number"
                    min="1"
                    max="50000"
                    value={messagePairs}
                    onChange={(event) => setMessagePairs(parseInt(event.target.value) || 1)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="stress-chat-user-paragraphs">Paragraphs Per User Message</Label>
                  <Input
                    id="stress-chat-user-paragraphs"
                    type="number"
                    min="1"
                    max="100"
                    value={paragraphsPerUserMessage}
                    onChange={(event) =>
                      setParagraphsPerUserMessage(parseInt(event.target.value) || 1)
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="stress-chat-assistant-paragraphs">
                    Paragraphs Per Assistant Message
                  </Label>
                  <Input
                    id="stress-chat-assistant-paragraphs"
                    type="number"
                    min="1"
                    max="100"
                    value={paragraphsPerAssistantMessage}
                    onChange={(event) =>
                      setParagraphsPerAssistantMessage(parseInt(event.target.value) || 1)
                    }
                  />
                </div>

                <div className="flex flex-col justify-end gap-2">
                  <Label htmlFor="stress-chat-reasoning">Include Reasoning Blocks</Label>
                  <Button
                    id="stress-chat-reasoning"
                    type="button"
                    variant={includeReasoning ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setIncludeReasoning((current) => !current)}
                  >
                    {includeReasoning ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>

              <div className="bg-muted/40 flex flex-col gap-1 rounded-md border p-4 text-sm">
                <div>Total messages: {totalMessages.toLocaleString()}</div>
                <div>
                  Assistant message blocks: {includeReasoning ? "reasoning + text" : "text only"}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleCreate} disabled={isCreating}>
                  <IconMessage2Plus data-icon="inline-start" />
                  {isCreating ? "Creating..." : "Make Test Chat"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
