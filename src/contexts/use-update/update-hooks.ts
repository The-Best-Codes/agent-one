import { useContext } from "react";

import { UpdateContext, type UpdateContextType } from "./update-contexts";

export const useUpdate = (): UpdateContextType => {
  const context = useContext(UpdateContext);
  if (context === undefined) {
    throw new Error("useUpdate must be used within an UpdateProvider");
  }
  return context;
};
