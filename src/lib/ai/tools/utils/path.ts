import { homeDir, isAbsolute, join } from "@tauri-apps/api/path";

export async function resolvePath(filePath: string, baseDir?: string): Promise<string> {
  if (filePath === "~") {
    return await homeDir();
  }
  if (filePath.startsWith("~/") || filePath.startsWith("~\\")) {
    const home = await homeDir();
    return await join(home, filePath.slice(2));
  }
  if (baseDir && !(await isAbsolute(filePath))) {
    return await join(baseDir, filePath);
  }
  return filePath;
}
