import { IconArrowLeft } from "@tabler/icons-react";
import { generateId, type UIMessage } from "ai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { chatStorage } from "@/lib/storage/chat-storage";

const BENCHMARK_CHAT_COUNT = 1_000;
const MESSAGES_PER_CHAT = 250;
const SEARCH_ITERATIONS = 1_000;
const WRITE_BATCH_SIZE = 25;
const READ_BATCH_SIZE = 50;
const DELETE_BATCH_SIZE = 250;
const SHARED_SEARCH_QUERY = "agent one local database stress benchmark";
const LONG_USER_SEGMENT =
  "This long benchmark prompt simulates a user request with several clauses, extra context, repeated requirements, and enough natural language to stress JSON serialization, SQLite writes, full-text indexing, and later retrieval performance under sustained local workload.";
const LONG_ASSISTANT_SEGMENT =
  "This long benchmark reply simulates an assistant response with multiple explanatory sentences, elaborated reasoning summaries, structured guidance, and intentionally verbose prose so the local database has to persist and index substantially larger message bodies than a lightweight smoke test would create.";

interface BenchmarkMetric {
  label: string;
  durationMs: number;
  details: string;
}

function createChatToken(chatIndex: number): string {
  return `stresschat${chatIndex.toString().padStart(5, "0")}`;
}

function createBenchmarkMessages(chatIndex: number, count: number): UIMessage[] {
  const chatToken = createChatToken(chatIndex);

  return Array.from({ length: count }, (_, messageIndex) => {
    const isUser = messageIndex % 2 === 0;
    const body = isUser ? LONG_USER_SEGMENT : LONG_ASSISTANT_SEGMENT;

    return {
      id: `${chatToken}-message-${messageIndex}`,
      role: isUser ? "user" : "assistant",
      parts: [
        {
          type: "text",
          text:
            `${SHARED_SEARCH_QUERY} ${chatToken} chat ${chatIndex} message ${messageIndex} ` +
            `${isUser ? "prompt" : "reply"}. ${body} ${body}`,
          state: "done",
        },
      ],
    };
  });
}

function formatDuration(durationMs: number): string {
  return `${durationMs.toFixed(1)} ms`;
}

function formatOpsPerSecond(operations: number, durationMs: number): string {
  if (durationMs <= 0) {
    return `${operations} ops/s`;
  }

  return `${Math.round((operations / durationMs) * 1000).toLocaleString()} ops/s`;
}

function createBenchmarkChatIds(): string[] {
  return Array.from(
    { length: BENCHMARK_CHAT_COUNT },
    (_, index) => `benchmark-${index}-${generateId()}`,
  );
}

function getBatchBounds(total: number, batchSize: number, batchIndex: number): [number, number] {
  const start = batchIndex * batchSize;
  const end = Math.min(start + batchSize, total);
  return [start, end];
}

function shouldLogProgress(processed: number, total: number, batchSize: number): boolean {
  return processed === total || processed % Math.max(batchSize * 10, 250) === 0;
}

async function yieldToUi(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

export default function LocalDatabaseTestRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<BenchmarkMetric[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const runBenchmark = async () => {
    if (isRunning) {
      return;
    }

    setIsRunning(true);
    setLogs([]);
    setMetrics([]);
    setSummary(null);

    const benchmarkChatIds = createBenchmarkChatIds();
    const nextMetrics: BenchmarkMetric[] = [];

    const measure = async (label: string, details: string, task: () => Promise<void>) => {
      addLog(`Starting ${label.toLowerCase()}...`);
      const start = performance.now();
      await task();
      const durationMs = performance.now() - start;
      nextMetrics.push({ label, durationMs, details });
      addLog(`Finished ${label.toLowerCase()} in ${formatDuration(durationMs)}`);
    };

    let initialChatIds = new Set<string>();

    try {
      initialChatIds = new Set((await chatStorage.listChats("created-at")).map(({ id }) => id));
      addLog(
        `Preparing ${BENCHMARK_CHAT_COUNT} temporary chats with ${MESSAGES_PER_CHAT} messages each.`,
      );

      await measure(
        "Write workload",
        `${BENCHMARK_CHAT_COUNT.toLocaleString()} chats, ${(BENCHMARK_CHAT_COUNT * MESSAGES_PER_CHAT).toLocaleString()} long messages`,
        async () => {
          const batchCount = Math.ceil(BENCHMARK_CHAT_COUNT / WRITE_BATCH_SIZE);

          for (let batchIndex = 0; batchIndex < batchCount; batchIndex += 1) {
            const [start, end] = getBatchBounds(BENCHMARK_CHAT_COUNT, WRITE_BATCH_SIZE, batchIndex);

            await Promise.all(
              benchmarkChatIds.slice(start, end).map(async (chatId, offset) => {
                const chatIndex = start + offset;
                const messages = createBenchmarkMessages(chatIndex, MESSAGES_PER_CHAT);
                const title = `Stress Benchmark Chat ${chatIndex + 1}`;

                await chatStorage.setChatMetadata(chatId, {
                  title,
                  titleState: "generated",
                  modelId: "benchmark",
                });
                await chatStorage.setChatMessages(chatId, messages);
                await chatStorage.updateFtsIndex(chatId, title, messages);
              }),
            );

            if (shouldLogProgress(end, BENCHMARK_CHAT_COUNT, WRITE_BATCH_SIZE)) {
              addLog(
                `Write progress: ${end.toLocaleString()} / ${BENCHMARK_CHAT_COUNT.toLocaleString()} chats`,
              );
            }

            await yieldToUi();
          }
        },
      );

      await measure(
        "Read workload",
        `${BENCHMARK_CHAT_COUNT.toLocaleString()} metadata reads and message reads`,
        async () => {
          const batchCount = Math.ceil(BENCHMARK_CHAT_COUNT / READ_BATCH_SIZE);

          for (let batchIndex = 0; batchIndex < batchCount; batchIndex += 1) {
            const [start, end] = getBatchBounds(BENCHMARK_CHAT_COUNT, READ_BATCH_SIZE, batchIndex);

            await Promise.all(
              benchmarkChatIds.slice(start, end).map(async (chatId) => {
                const [metadata, messages] = await Promise.all([
                  chatStorage.getChatMetadata(chatId),
                  chatStorage.getChatMessages(chatId),
                ]);

                if (!metadata || !messages || messages.length !== MESSAGES_PER_CHAT) {
                  throw new Error(`Unexpected benchmark data for ${chatId}`);
                }
              }),
            );

            if (shouldLogProgress(end, BENCHMARK_CHAT_COUNT, READ_BATCH_SIZE)) {
              addLog(
                `Read progress: ${end.toLocaleString()} / ${BENCHMARK_CHAT_COUNT.toLocaleString()} chats`,
              );
            }

            await yieldToUi();
          }
        },
      );

      await measure(
        "Search workload",
        `${SEARCH_ITERATIONS.toLocaleString()} full-text searches across unique chat tokens`,
        async () => {
          for (let iteration = 0; iteration < SEARCH_ITERATIONS; iteration += 1) {
            const chatIndex = iteration % BENCHMARK_CHAT_COUNT;
            const query = createChatToken(chatIndex);
            const expectedChatId = benchmarkChatIds[chatIndex];
            const results = await chatStorage.searchChats(query);

            if (!results.some((result) => result.chatId === expectedChatId)) {
              throw new Error(`Expected search hit for ${expectedChatId} using query ${query}`);
            }

            if ((iteration + 1) % 100 === 0 || iteration + 1 === SEARCH_ITERATIONS) {
              addLog(
                `Search progress: ${(iteration + 1).toLocaleString()} / ${SEARCH_ITERATIONS.toLocaleString()} queries`,
              );
            }

            if ((iteration + 1) % 25 === 0) {
              await yieldToUi();
            }
          }
        },
      );

      const writeMetric = nextMetrics[0];
      const readMetric = nextMetrics[1];
      const searchMetric = nextMetrics[2];
      const writeOps = BENCHMARK_CHAT_COUNT * 3;
      const readOps = BENCHMARK_CHAT_COUNT * 2;

      setSummary(
        [
          `Writes: ${formatOpsPerSecond(writeOps, writeMetric?.durationMs ?? 0)}`,
          `Reads: ${formatOpsPerSecond(readOps, readMetric?.durationMs ?? 0)}`,
          `Search average: ${formatDuration((searchMetric?.durationMs ?? 0) / SEARCH_ITERATIONS)}`,
        ].join(" | "),
      );
      setMetrics(nextMetrics);
      addLog("Benchmark completed successfully.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMetrics(nextMetrics);
      setSummary(`Benchmark failed: ${errorMessage}`);
      addLog(`Benchmark failed: ${errorMessage}`);
    } finally {
      addLog("Cleaning up temporary benchmark chats...");
      try {
        const batchCount = Math.ceil(BENCHMARK_CHAT_COUNT / DELETE_BATCH_SIZE);

        for (let batchIndex = 0; batchIndex < batchCount; batchIndex += 1) {
          const [start, end] = getBatchBounds(BENCHMARK_CHAT_COUNT, DELETE_BATCH_SIZE, batchIndex);
          await chatStorage.bulkDeleteChats(benchmarkChatIds.slice(start, end));

          if (shouldLogProgress(end, BENCHMARK_CHAT_COUNT, DELETE_BATCH_SIZE)) {
            addLog(
              `Cleanup progress: ${end.toLocaleString()} / ${BENCHMARK_CHAT_COUNT.toLocaleString()} chats`,
            );
          }

          await yieldToUi();
        }

        const finalChatIds = new Set(
          (await chatStorage.listChats("created-at")).map(({ id }) => id),
        );
        const chatListChanged =
          finalChatIds.size !== initialChatIds.size ||
          Array.from(initialChatIds).some((chatId) => !finalChatIds.has(chatId));
        if (chatListChanged) {
          const cleanupMessage = "The stored chat list changed during cleanup.";
          setSummary((current) =>
            current
              ? `${current} Cleanup issue: ${cleanupMessage}`
              : `Cleanup issue: ${cleanupMessage}`,
          );
          addLog(`Cleanup failed: ${cleanupMessage}`);
        } else {
          addLog("Cleanup finished. Existing chats were left unchanged.");
        }
      } catch (cleanupError) {
        const cleanupMessage =
          cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        setSummary((current) =>
          current
            ? `${current} Cleanup issue: ${cleanupMessage}`
            : `Cleanup issue: ${cleanupMessage}`,
        );
        addLog(`Cleanup failed: ${cleanupMessage}`);
      } finally {
        setIsRunning(false);
      }
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
          <h1 className="text-2xl font-bold">{t("tests.localDatabaseTest")}</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("tests.stressBenchmark")}</CardTitle>
              <CardDescription>
                Writes temporary chats into the local SQLite database, reads them back, benchmarks
                search performance, then deletes everything it created without modifying your saved
                chat list.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="text-muted-foreground text-sm">
                Workload: {BENCHMARK_CHAT_COUNT.toLocaleString()} chats, {MESSAGES_PER_CHAT} long
                messages per chat, {SEARCH_ITERATIONS.toLocaleString()} search passes.
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void runBenchmark()} disabled={isRunning}>
                  {isRunning ? "Running Stress Test..." : "Run Stress Test"}
                </Button>
              </div>
              {summary ? <div className="rounded-md border p-3 text-sm">{summary}</div> : null}
            </CardContent>
          </Card>

          {metrics.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("tests.results")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-md border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium">{metric.label}</div>
                        <div className="text-muted-foreground text-sm">{metric.details}</div>
                      </div>
                      <div className="text-sm font-medium">{formatDuration(metric.durationMs)}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {logs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("tests.logs")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/20 max-h-96 overflow-y-auto rounded-md border p-4">
                  <pre className="font-mono text-xs whitespace-pre-wrap">{logs.join("\n")}</pre>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
