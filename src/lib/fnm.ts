// This file uses fnm (Fast Node Manager) as a sidecar binary.
// fnm is licensed under GPLv3. See licenses/fnm-copyright.txt for details.
// Source: https://github.com/Schniz/fnm

import { type Child, Command } from "@tauri-apps/plugin-shell";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export type FnmInstallStatus =
  | { type: "started"; version: string; arch: string }
  | {
      type: "progress";
      downloaded: number; // in bytes
      total: number; // in bytes
      percent: number; // 0-100
      speed: string; // e.g., "10.00 MiB/s"
      eta: string; // e.g., "0s"
    }
  | { type: "already_installed"; version: string; path: string }
  | { type: "success"; version: string; path: string | null }
  | { type: "error"; message: string };

export type OnFnmInstallProgress = (status: FnmInstallStatus) => void;

export interface FnmInstallResult {
  version: string;
  path: string | null;
}

function parseSizeToBytes(sizeStr: string): number {
  const [value, unit] = sizeStr.trim().split(" ");
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 0;

  switch (unit.toUpperCase()) {
    case "B":
      return numValue;
    case "KB":
    case "KIB":
      return numValue * 1024;
    case "MB":
    case "MIB":
      return numValue * 1024 * 1024;
    case "GB":
    case "GIB":
      return numValue * 1024 * 1024 * 1024;
    default:
      return 0;
  }
}

export function installNodeVersion(
  version: string,
  onProgress: OnFnmInstallProgress,
): Promise<FnmInstallResult> {
  return new Promise((resolve, reject) => {
    let child: Child | null = null;
    let state: "idle" | "installing" | "done" | "error" = "idle";
    let fullVersion: string | null = null;
    let installPath: string | null = null;

    const cleanupAndReject = (error: Error) => {
      if (state !== "error") {
        state = "error";
        logger.error(`fnm install failed:`, error);
        onProgress({ type: "error", message: error.message });
        child?.kill();
        reject(error);
      }
    };

    const command = Command.sidecar("binaries/fnm", ["install", version]);

    command.stdout.on("data", (line: string) => {
      logger.verbose(`[fnm stdout]: ${line.trim()}`);
      if (state === "error") return;

      const startedMatch = line.match(
        /^Installing Node v(?<version>[\d.]+) \((?<arch>[^)]+)\)/,
      );
      if (startedMatch?.groups) {
        state = "installing";
        fullVersion = startedMatch.groups.version;
        onProgress({
          type: "started",
          version: fullVersion,
          arch: startedMatch.groups.arch,
        });
        return;
      }

      const alreadyInstalledMatch = line.match(
        /^warning: Version already installed at "(?<path>[^"]+)"/,
      );
      if (alreadyInstalledMatch?.groups) {
        installPath = alreadyInstalledMatch.groups.path;
        if (fullVersion) {
          onProgress({
            type: "already_installed",
            version: fullVersion,
            path: installPath,
          });
        }
        return;
      }

      const progressChunks = line.split("\r");
      const progressLine = progressChunks[progressChunks.length - 1];

      const progressMatch = progressLine.match(
        /(?<downloaded>[\d.]+ \w+B)\/(?<total>[\d.]+ \w+B) \((?<speed>[^,]+), (?<eta>[^)]+)\)/,
      );
      if (progressMatch?.groups) {
        const { downloaded, total, speed, eta } = progressMatch.groups;
        const downloadedBytes = parseSizeToBytes(downloaded);
        const totalBytes = parseSizeToBytes(total);
        const percent =
          totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;

        onProgress({
          type: "progress",
          downloaded: downloadedBytes,
          total: totalBytes,
          percent: Math.min(100, percent),
          speed,
          eta,
        });
      }
    });

    command.stderr.on("data", (line: string) => {
      logger.verbose(`[fnm stderr]: ${line.trim()}`);
      const errorMatch = line.match(/^error: (?<message>.*)/);
      if (errorMatch?.groups) {
        cleanupAndReject(new Error(errorMatch.groups.message.trim()));
      }
    });

    command.on("close", ({ code }) => {
      if (state === "error") return;

      if (code === 0) {
        if (!fullVersion) {
          cleanupAndReject(
            new Error("fnm process finished but version was not identified."),
          );
          return;
        }
        state = "done";
        const result: FnmInstallResult = {
          version: fullVersion,
          path: installPath,
        };
        logger.info(`fnm install completed successfully for v${fullVersion}`);
        onProgress({ type: "success", ...result });
        resolve(result);
      } else {
        cleanupAndReject(new Error(`fnm process exited with code ${code}.`));
      }
    });

    command.on("error", (error: string) => {
      cleanupAndReject(new Error(error));
    });

    command
      .spawn()
      .then((spawnedChild) => {
        child = spawnedChild;
        logger.verbose(`Spawned fnm install with PID: ${child.pid}`);
      })
      .catch((err) => {
        cleanupAndReject(err instanceof Error ? err : new Error(String(err)));
      });
  });
}
