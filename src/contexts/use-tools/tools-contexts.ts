import { createContext } from "react";

import type { ToolsContextType } from "./tools-context";

export const ToolsContext = createContext<ToolsContextType | undefined>(undefined);
