import { type ConsolaInstance, type ConsolaReporter, createConsola, LogLevels } from "consola";
import { atom, getDefaultStore } from "jotai";
import debounce from "lodash.debounce";

const jotaiStore = getDefaultStore();

const isNodeJs = typeof process !== "undefined" && process.versions && process.versions.node;
const hasLocalStorage = !isNodeJs && typeof localStorage !== "undefined";

const MAX_LOG_STORAGE_SIZE = 500 * 1024;
const LOG_STORAGE_KEY = "app:log-history";

export interface LogEntry {
  timestamp: string;
  type: string;
  tag: string;
  message: string;
}

let logHistory: LogEntry[] = [];

const logHistoryVersionAtom = atom(0);

export const logHistoryAtom = atom((get) => {
  get(logHistoryVersionAtom);
  return logHistory;
});

if (hasLocalStorage) {
  try {
    const stored = localStorage.getItem(LOG_STORAGE_KEY);
    if (stored) {
      logHistory = JSON.parse(stored) as LogEntry[];
    }
  } catch {
    logHistory = [];
  }
}

const flushLogs = debounce(() => {
  try {
    let serialized = JSON.stringify(logHistory);
    while (serialized.length > MAX_LOG_STORAGE_SIZE && logHistory.length > 1) {
      logHistory.shift();
      serialized = JSON.stringify(logHistory);
    }
    localStorage.setItem(LOG_STORAGE_KEY, serialized);
  } catch {
    // Storage unavailable or full
  }
}, 500);

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

const storageReporter: ConsolaReporter = {
  log(logObj) {
    const parts = [logObj.message, ...logObj.args].filter((a) => a != null);
    const message = parts.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
    logHistory.push({
      timestamp: logObj.date?.toISOString() ?? new Date().toISOString(),
      type: logObj.type,
      tag: logObj.tag,
      message,
    });
    jotaiStore.set(logHistoryVersionAtom, (v) => v + 1);
    flushLogs();
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
  instance.addReporter(storageReporter);
  return instance.withTag(filename);
}

export function clearLogHistory(): void {
  logHistory = [];
  jotaiStore.set(logHistoryVersionAtom, (v) => v + 1);
  if (hasLocalStorage) {
    localStorage.removeItem(LOG_STORAGE_KEY);
  }
}
