import { useContext } from "react";
import { ThreadFunctionsContext, ThreadStatusContext } from "./thread-contexts";

// Hook types
export type ThreadStatusContextType = {
  threadStopped: boolean;
};

export type ThreadFunctionsContextType = {
  stopThread: () => void;
  unstopThread: () => void;
};

export const useThreadStatus = (): ThreadStatusContextType => {
  const context = useContext(ThreadStatusContext);
  if (context === undefined) {
    throw new Error("useThreadStatus must be used within a ThreadProvider");
  }
  return context;
};

export const useThreadFunctions = (): ThreadFunctionsContextType => {
  const context = useContext(ThreadFunctionsContext);
  if (context === undefined) {
    throw new Error("useThreadFunctions must be used within a ThreadProvider");
  }
  return context;
};
