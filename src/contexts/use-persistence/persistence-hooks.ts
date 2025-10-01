import { useContext } from "react";

import type { PersistenceContextType } from "./persistence-context";
import { PersistenceContext } from "./persistence-contexts";

export const usePersistence = (): PersistenceContextType => {
  const context = useContext(PersistenceContext);
  if (context === undefined) {
    throw new Error("usePersistence must be used within a PersistenceProvider");
  }
  return context;
};
