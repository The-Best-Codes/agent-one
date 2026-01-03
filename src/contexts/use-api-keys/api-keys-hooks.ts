import { useContext } from "react";

import { ApiKeysContext, type ApiKeysContextType } from "./api-keys-contexts";

export const useApiKeys = (): ApiKeysContextType => {
  const context = useContext(ApiKeysContext);
  if (context === undefined) {
    throw new Error("useApiKeys must be used within an ApiKeysProvider");
  }
  return context;
};
