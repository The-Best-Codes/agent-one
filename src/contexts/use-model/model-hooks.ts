import { useContext } from "react";

import { type ModelContextType } from "./model-context";
import { ModelContext } from "./model-contexts";

export const useModel = (): ModelContextType => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
};
