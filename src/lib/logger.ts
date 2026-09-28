import { isTauri } from "@tauri-apps/api/core";
import { debug, error, info, trace, warn } from "@tauri-apps/plugin-log";
import { type ConsolaInstance, type ConsolaReporter, createConsola, LogLevels } from "consola";

const isNodeJs = typeof process !== "undefined" && process.versions && process.versions.node;

function serializeLogValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.stack ?? `${value.name}: ${value.message}`;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getTagFromPathOrUrl(inputPath: string): string {
  if (isNodeJs) {
    return "node-process";
  } else {
    try {
      const url = new URL(inputPath);
      const pathname = url.pathname;
      return pathname || "browser-module";
    } catch (e) {
      console.warn(
        "getLogger: Could not parse input as URL in browser, falling back.",
        inputPath,
        e,
      );
      return inputPath || "unknown-module";
    }
  }
}

const diskReporter: ConsolaReporter = {
  log(logObj) {
    if (!isTauri()) return;

    const parts = [logObj.message, ...logObj.args].filter((a) => a != null);
    const message = `[${logObj.tag}] ${parts.map(serializeLogValue).join(" ")}`;
    const write =
      logObj.type === "error" || logObj.type === "fatal" || logObj.type === "fail"
        ? error
        : logObj.type === "warn"
          ? warn
          : logObj.type === "debug"
            ? debug
            : logObj.type === "trace" || logObj.type === "verbose"
              ? trace
              : info;

    void write(message).catch((reason: unknown) => {
      console.error("Failed to write application log", reason);
    });
  },
};

/**
 * Creates a Consola logger instance tagged with the filename derived from the given path/URL.
 * This function is optimized for browser environments, using `URL` to parse `import.meta.url`.
 * In a Node.js environment, it returns a generic tag to prevent errors.
 *
 * @param filePath The path or URL to the current file. For browser ESM modules, use `import.meta.url`.
 *                 Example: `const logger = getLogger(import.meta.url);`
 * @returns A ConsolaInstance specifically tagged for the given file, e.g., "[my-module] My log message."
 */
export function getLogger(filePath: string): ConsolaInstance {
  const filename = getTagFromPathOrUrl(filePath);
  const instance = createConsola({
    level: LogLevels.verbose,
  });
  instance.addReporter(diskReporter);
  return instance.withTag(filename);
}
