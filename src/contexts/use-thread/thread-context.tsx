import React, { useMemo, useState, useCallback, type ReactNode } from "react";
import { ThreadFunctionsContext, ThreadStatusContext } from "./thread-contexts";

// Main provider type
interface ThreadProviderProps {
  children: ReactNode;
}

export const ThreadProvider: React.FC<ThreadProviderProps> = ({ children }) => {
  const [threadStopped, setThreadStopped] = useState<boolean>(false);

  const stopThread = useCallback(() => {
    setThreadStopped(true);
  }, []);

  const unstopThread = useCallback(() => {
    setThreadStopped(false);
  }, []);

  const statusValue = useMemo(
    () => ({
      threadStopped,
    }),
    [threadStopped],
  );

  const functionsValue = useMemo(
    () => ({
      stopThread,
      unstopThread,
    }),
    [stopThread, unstopThread],
  );

  return (
    <ThreadStatusContext.Provider value={statusValue}>
      <ThreadFunctionsContext.Provider value={functionsValue}>
        {children}
      </ThreadFunctionsContext.Provider>
    </ThreadStatusContext.Provider>
  );
};
