import { createContext } from "react";

export interface ApiKeysContextType {
  isApiKeysLoading: boolean;
  getApiKeysLoadedPromise: () => Promise<void>;
}

export const ApiKeysContext = createContext<ApiKeysContextType | undefined>(
  undefined,
);
