import { createContext } from "react";

import type { ApiKeysContextType } from "./api-keys-context";

export const ApiKeysContext = createContext<ApiKeysContextType | undefined>(
  undefined,
);
