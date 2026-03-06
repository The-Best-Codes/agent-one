import { createContext } from "react";

import type { ModelContextType } from "./model-context";

export const ModelContext = createContext<ModelContextType | undefined>(undefined);
