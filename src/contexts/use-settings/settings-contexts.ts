import { createContext } from "react";

import type { SettingsContextType } from "./settings-context";

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);