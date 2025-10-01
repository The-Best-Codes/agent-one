import { createContext } from "react";

import type { PersistenceContextType } from "./persistence-context";

export const PersistenceContext = createContext<
  PersistenceContextType | undefined
>(undefined);
