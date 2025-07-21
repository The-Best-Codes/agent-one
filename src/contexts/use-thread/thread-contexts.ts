import { createContext } from "react";
import type {
  ThreadFunctionsContextType,
  ThreadStatusContextType,
} from "./thread-hooks";

// Contexts
export const ThreadStatusContext = createContext<
  ThreadStatusContextType | undefined
>(undefined);
export const ThreadFunctionsContext = createContext<
  ThreadFunctionsContextType | undefined
>(undefined);
