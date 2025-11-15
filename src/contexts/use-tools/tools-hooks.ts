import { useContext } from "react";

import { type ToolsContextType } from "./tools-context";
import { ToolsContext } from "./tools-contexts";

export const useTools = (): ToolsContextType => {
  const context = useContext(ToolsContext);
  if (context === undefined) {
    throw new Error("useTools must be used within a ToolsProvider");
  }
  return context;
};
