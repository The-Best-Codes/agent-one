import { IconArrowLeft, IconSearch, IconTrash } from "@tabler/icons-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtomValue } from "jotai";
import { useResetAtom } from "jotai/utils";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import formatBytes from "@/lib/format-bytes";
import { logHistoryAtom } from "@/lib/logger";

const TYPE_COLORS: Record<string, string> = {
  error: "text-red-500",
  warn: "text-yellow-500",
  verbose: "text-muted-foreground",
};

export default function LogsTestRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logs = useAtomValue(logHistoryAtom);
  const clearLogs = useResetAtom(logHistoryAtom);
  const [searchQuery, setSearchQuery] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return [...logs].reverse();
    const query = searchQuery.toLowerCase();
    return [...logs]
      .reverse()
      .filter(
        (log) =>
          log.type.toLowerCase().includes(query) ||
          log.tag.toLowerCase().includes(query) ||
          log.message.toLowerCase().includes(query),
      );
  }, [logs, searchQuery]);

  const totalBytes = useMemo(() => JSON.stringify(logs).length, [logs]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 5,
  });

  const isEmpty = filteredLogs.length === 0;

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/tests")}>
            <IconArrowLeft data-icon="inline-start" />
            {t("tests.backToTests")}
          </Button>
          <h1 className="text-2xl font-bold">{t("tests.logHistory")}</h1>
          <div className="ml-auto">
            <Button variant="destructive" size="sm" onClick={clearLogs}>
              <IconTrash data-icon="inline-start" />
              {t("common.clear")}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("tests.logsTitle", { count: logs.length, size: formatBytes(totalBytes) })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-border/50 border-b px-3 py-2">
              <div className="relative">
                <IconSearch className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  placeholder={t("common.search")}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-[70vh] overflow-auto" ref={parentRef}>
              {isEmpty ? (
                <p className="text-muted-foreground py-12 text-center">
                  {searchQuery.trim() ? "No logs match your search." : "No log entries yet."}
                </p>
              ) : (
                <>
                  <div className="text-muted-foreground grid grid-cols-[7rem_4rem_9rem_1fr] gap-0 border-b px-3 py-2 text-left text-xs font-medium uppercase">
                    <div>Time</div>
                    <div>Type</div>
                    <div>Tag</div>
                    <div>Message</div>
                  </div>
                  <div
                    style={{
                      height: `${virtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                      const log = filteredLogs[virtualItem.index];
                      return (
                        <div
                          key={virtualItem.key}
                          ref={virtualizer.measureElement}
                          data-index={virtualItem.index}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                        >
                          <div className="border-border/50 hover:bg-accent/50 grid grid-cols-[7rem_4rem_9rem_1fr] gap-0 border-b px-3 py-1.5 text-xs">
                            <div className="text-muted-foreground truncate tabular-nums">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                            <div className={`truncate font-medium ${TYPE_COLORS[log.type] ?? ""}`}>
                              {log.type}
                            </div>
                            <div className="truncate font-medium">{log.tag}</div>
                            <div className="break-all whitespace-pre-wrap">{log.message}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
