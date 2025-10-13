import { ThemeProvider } from "next-themes";
import React from "react";
import ReactDOM from "react-dom/client";

import ErrorBoundary from "@/components/error-boundary";
import { ModelProvider } from "@/contexts/use-model/model-context";
import { PersistenceProvider } from "@/contexts/use-persistence/persistence-context";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="system"
        attribute="class"
        enableSystem={true}
        storageKey="theme"
      >
        <PersistenceProvider>
          <ModelProvider>
            <App />
          </ModelProvider>
        </PersistenceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
