import { createContext } from "react";

import type { PersistenceContextType } from "./persistence-hooks";

export const PersistenceContext = createContext<
  PersistenceContextType | undefined
>(undefined);
