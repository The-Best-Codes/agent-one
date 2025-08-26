import { type ConsolaInstance, createConsola, LogLevels } from "consola";

const isNodeJs =
  typeof process !== "undefined" && process.versions && process.versions.node;

function getTagFromPathOrUrl(inputPath: string): string {
  if (isNodeJs) {
    return "node-process";
  } else {
    try {
      const url = new URL(inputPath);
      const pathname = url.pathname;

      const parts = pathname.split("/");
      let filenameWithExt = parts[parts.length - 1];

      if (filenameWithExt.includes("?")) {
        filenameWithExt = filenameWithExt.split("?")[0];
      }
      if (filenameWithExt.includes("#")) {
        filenameWithExt = filenameWithExt.split("#")[0];
      }

      if (filenameWithExt.includes(".")) {
        return filenameWithExt.substring(0, filenameWithExt.lastIndexOf("."));
      }

      return filenameWithExt || "browser-module";
    } catch (e) {
      console.warn(
        "getLogger: Could not parse input as URL in browser, falling back.",
        inputPath,
        e,
      );

      const parts = inputPath.split("/");
      const filename = parts[parts.length - 1];
      if (filename.includes(".")) {
        return filename.substring(0, filename.lastIndexOf("."));
      }
      return filename || "unknown-module";
    }
  }
}

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
  return createConsola({
    level: LogLevels.verbose,
  }).withTag(filename);
}
