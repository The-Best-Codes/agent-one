import { createContext } from "react";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "managed-externally"
  | "up-to-date"
  | "available"
  | "downloading"
  | "installing"
  | "ready"
  | "error";

export interface UpdateContextType {
  updateStatus: UpdateStatus;
  updateProgress: number | null;
  updateVersion: string;
  updateError: string | null;
  installsOnRestart: boolean;
  checkForUpdates: () => Promise<void>;
  downloadAndInstallUpdate: () => Promise<void>;
  finishUpdate: () => Promise<void>;
}

export const UpdateContext = createContext<UpdateContextType | undefined>(undefined);
