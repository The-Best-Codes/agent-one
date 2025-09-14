import {
  ArrowLeftIcon,
  CheckCircleIcon,
  LoaderIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type FnmInstallStatus, installNodeVersion } from "@/lib/fnm";

interface TestResult {
  status: "idle" | "running" | "success" | "error";
  message?: string;
  version?: string;
  path?: string;
  progress?: number;
  speed?: string;
  eta?: string;
}

export default function FnmTestRoute() {
  const navigate = useNavigate();
  const [testResult, setTestResult] = useState<TestResult>({ status: "idle" });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const runNodeInstallTest = async () => {
    setTestResult({ status: "running" });
    setLogs([]);
    addLog("Starting Node.js 22 installation test...");

    try {
      const result = await installNodeVersion(
        "22",
        (status: FnmInstallStatus) => {
          switch (status.type) {
            case "started":
              addLog(
                `Installation started: Node v${status.version} (${status.arch})`,
              );
              setTestResult((prev) => ({
                ...prev,
                version: status.version,
                message: `Installing Node v${status.version} (${status.arch})`,
              }));
              break;

            case "progress":
              addLog(
                `Progress: ${status.percent.toFixed(1)}% (${status.speed}, ETA: ${status.eta})`,
              );
              setTestResult((prev) => ({
                ...prev,
                progress: status.percent,
                speed: status.speed,
                eta: status.eta,
                message: `Downloading... ${status.percent.toFixed(1)}%`,
              }));
              break;

            case "already_installed":
              addLog(
                `Node v${status.version} already installed at: ${status.path}`,
              );
              setTestResult((prev) => ({
                ...prev,
                version: status.version,
                path: status.path,
                message: "Already installed",
              }));
              break;

            case "success":
              addLog(
                `Installation completed successfully: Node v${status.version}`,
              );
              if (status.path) {
                addLog(`Installation path: ${status.path}`);
              }
              setTestResult({
                status: "success",
                version: status.version,
                path: status.path || undefined,
                message: "Installation completed successfully",
              });
              break;

            case "error":
              addLog(`Error: ${status.message}`);
              setTestResult({
                status: "error",
                message: status.message,
              });
              break;
          }
        },
      );

      addLog(
        `Test completed successfully. Final result: Node v${result.version}`,
      );
      if (result.path) {
        addLog(`Final path: ${result.path}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addLog(`Test failed: ${errorMessage}`);
      setTestResult({
        status: "error",
        message: errorMessage,
      });
    }
  };

  const getStatusIcon = () => {
    switch (testResult.status) {
      case "running":
        return <LoaderIcon className="h-5 w-5 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (testResult.status) {
      case "running":
        return <Badge variant="secondary">Running</Badge>;
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Success
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/tests")}
            className="gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Tests
          </Button>
          <h1 className="text-2xl font-bold">FNM Node Installation Test</h1>
        </div>

        <div className="grid gap-6">
          {/* Test Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Node.js 22 Installation Test
                {getStatusIcon()}
                {getStatusBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                This test will attempt to install Node.js version 22 using fnm
                (Fast Node Manager). It will show progress updates and verify
                the installation completes successfully.
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={runNodeInstallTest}
                  disabled={testResult.status === "running"}
                  className="gap-2"
                >
                  {testResult.status === "running" && (
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                  )}
                  {testResult.status === "running"
                    ? "Installing..."
                    : "Run Test"}
                </Button>

                {testResult.status !== "idle" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTestResult({ status: "idle" });
                      setLogs([]);
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>

              {/* Progress Display */}
              {testResult.status === "running" &&
                testResult.progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Download Progress</span>
                      <span>{testResult.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={testResult.progress} className="w-full" />
                    {testResult.speed && testResult.eta && (
                      <div className="text-muted-foreground flex justify-between text-xs">
                        <span>Speed: {testResult.speed}</span>
                        <span>ETA: {testResult.eta}</span>
                      </div>
                    )}
                  </div>
                )}

              {/* Status Message */}
              {testResult.message && (
                <div className="bg-muted/50 rounded-lg border p-3">
                  <p className="text-sm font-medium">{testResult.message}</p>
                  {testResult.version && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Version: {testResult.version}
                    </p>
                  )}
                  {testResult.path && (
                    <p className="text-muted-foreground mt-1 font-mono text-xs">
                      Path: {testResult.path}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logs */}
          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/20 max-h-96 overflow-y-auto rounded-lg border p-4">
                  <pre className="font-mono text-xs whitespace-pre-wrap">
                    {logs.join("\n")}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
