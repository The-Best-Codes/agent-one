import { type ConsolaInstance, type ConsolaReporter, createConsola, LogLevels } from "consola";
import { atom, getDefaultStore, type SetStateAction } from "jotai";
import { atomWithStorage, RESET } from "jotai/utils";

const jotaiStore = getDefaultStore();

const isNodeJs = typeof process !== "undefined" && process.versions && process.versions.node;

const MAX_LOG_STORAGE_SIZE = 500 * 1024;
const LOG_STORAGE_KEY = "app:log-history";

export interface LogEntry {
  timestamp: string;
  type: string;
  tag: string;
  message: string;
}

function limitStoredLogs(logs: LogEntry[]): LogEntry[] {
  const storedLogs = [...logs];
  while (JSON.stringify(storedLogs).length > MAX_LOG_STORAGE_SIZE && storedLogs.length > 1) {
    storedLogs.shift();
  }

  if (storedLogs.length === 1) {
    const serializedLength = JSON.stringify(storedLogs).length;
    if (serializedLength > MAX_LOG_STORAGE_SIZE) {
      const [log] = storedLogs;
      storedLogs[0] = {
        ...log,
        message: log.message.slice(
          0,
          log.message.length - (serializedLength - MAX_LOG_STORAGE_SIZE),
        ),
      };
    }
  }

  return storedLogs;
}

function serializeLogValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.stack ?? `${value.name}: ${value.message}`;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const storedLogHistoryAtom = atomWithStorage<LogEntry[]>(LOG_STORAGE_KEY, [], undefined, {
  getOnInit: true,
});
const currentLogHistoryAtom = atom(limitStoredLogs(jotaiStore.get(storedLogHistoryAtom)));
const storageTimeoutAtom = atom<ReturnType<typeof setTimeout>>();

export const logHistoryAtom = atom(
  (get) => get(currentLogHistoryAtom),
  (get, set, update: SetStateAction<LogEntry[]> | typeof RESET) => {
    clearTimeout(get(storageTimeoutAtom));

    if (update === RESET) {
      set(currentLogHistoryAtom, []);
      set(storedLogHistoryAtom, RESET);
      return;
    }

    const previousLogs = get(currentLogHistoryAtom);
    const logs = limitStoredLogs(typeof update === "function" ? update(previousLogs) : update);

    set(currentLogHistoryAtom, logs);
    set(
      storageTimeoutAtom,
      setTimeout(() => set(storedLogHistoryAtom, logs), 500),
    );
  },
);

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
    const message = parts.map(serializeLogValue).join(" ");
    jotaiStore.set(logHistoryAtom, (logHistory) => [
      ...logHistory,
      {
        timestamp: logObj.date?.toISOString() ?? new Date().toISOString(),
        type: logObj.type,
        tag: logObj.tag,
        message,
      },
    ]);
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
