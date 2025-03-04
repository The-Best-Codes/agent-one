/**
 * Converts bytes to a human-readable string representation.
 *
 * @param bytes The number of bytes.
 * @param decimals The number of decimal places to round to (default: 2).
 * @returns A string representing the size in bytes, KB, MB, GB, TB, PB, EB, ZB, or YB.
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default formatBytes;
