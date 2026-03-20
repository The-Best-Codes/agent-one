import { createContext } from "react";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "downloading"
  | "installing"
  | "error";

export interface UpdateContextType {
  updateStatus: UpdateStatus;
  updateProgress: number;
  updateVersion: string;
  checkForUpdates: () => Promise<void>;
  downloadAndInstallUpdate: () => Promise<void>;
  dialogOpen: boolean;
  handleRemind: (days: number) => void;
}

export const UpdateContext = createContext<UpdateContextType | undefined>(undefined);
