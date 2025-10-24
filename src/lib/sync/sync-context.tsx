import React, { type ReactNode } from "react";

export const SyncProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};
