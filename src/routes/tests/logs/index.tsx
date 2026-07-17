import { IconArrowLeft, IconTrash } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useResetAtom } from "jotai/utils";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logHistoryAtom } from "@/lib/logger";

const TYPE_COLORS: Record<string, string> = {
  error: "text-red-500",
  warn: "text-yellow-500",
  verbose: "text-muted-foreground",
};

export default function LogsTestRoute() {
  const navigate = useNavigate();
  const logs = useAtomValue(logHistoryAtom);
  const clearLogs = useResetAtom(logHistoryAtom);

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/tests")}>
            <IconArrowLeft data-icon="inline-start" />
            Back to Tests
          </Button>
          <h1 className="text-2xl font-bold">Log History</h1>
          <div className="ml-auto">
            <Button variant="destructive" size="sm" onClick={clearLogs}>
              <IconTrash data-icon="inline-start" />
              Clear
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Logs ({logs.length} entries)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto">
              {logs.length === 0 ? (
                <p className="text-muted-foreground py-12 text-center">No log entries yet.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left text-xs uppercase">
                      <th className="w-28 px-3 py-2 font-medium">Time</th>
                      <th className="w-16 px-3 py-2 font-medium">Type</th>
                      <th className="w-36 px-3 py-2 font-medium">Tag</th>
                      <th className="px-3 py-2 font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...logs].reverse().map((log, i) => (
                      <tr key={i} className="border-border/50 hover:bg-accent/50 border-b">
                        <td className="text-muted-foreground w-28 truncate px-3 py-1.5 text-xs tabular-nums">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td
                          className={`w-16 truncate px-3 py-1.5 text-xs font-medium ${TYPE_COLORS[log.type] ?? ""}`}
                        >
                          {log.type}
                        </td>
                        <td className="w-36 truncate px-3 py-1.5 text-xs font-medium">{log.tag}</td>
                        <td className="px-3 py-1.5 text-xs break-all whitespace-pre-wrap">
                          {log.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
