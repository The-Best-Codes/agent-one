import { homeDir, isAbsolute, join } from "@tauri-apps/api/path";
import { exists } from "@tauri-apps/plugin-fs";

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

export async function assertProjectFolderExists(folder: string | undefined): Promise<void> {
  if (folder && !(await exists(folder))) {
    throw new Error(
      `The project folder "${folder}" no longer exists. Ask the user to choose the project's folder again in its project settings.`,
    );
  }
}

export async function resolveToolPath(filePath: string, baseDir?: string): Promise<string> {
  if (baseDir && !filePath.startsWith("~") && !(await isAbsolute(filePath))) {
    await assertProjectFolderExists(baseDir);
  }
  return resolvePath(filePath, baseDir);
}
