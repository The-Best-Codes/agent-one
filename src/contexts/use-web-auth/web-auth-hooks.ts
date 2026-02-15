import { useContext } from "react";

import { WebAuthContext, type WebAuthContextType } from "./web-auth-contexts";

export const useWebAuth = (): WebAuthContextType => {
  const context = useContext(WebAuthContext);
  if (context === undefined) {
    throw new Error("useWebAuth must be used within a WebAuthProvider");
  }
  return context;
};
