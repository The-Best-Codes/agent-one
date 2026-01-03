import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";

import ErrorBoundary from "@/components/error-boundary";
import { ThemeRegistry } from "@/components/theme/theme-registry";
import { ApiKeysProvider } from "@/contexts/use-api-keys/api-keys-context";
import { ModelProvider } from "@/contexts/use-model/model-context";
import { PersistenceProvider } from "@/contexts/use-persistence/persistence-context";
import { ToolsProvider } from "@/contexts/use-tools/tools-context";
import SuspenseFallback from "@/routes/suspense-fallback";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeRegistry />
      <PersistenceProvider>
        <ApiKeysProvider>
          <ToolsProvider>
            <ModelProvider>
              <Suspense fallback={<SuspenseFallback />}>
                <App />
              </Suspense>
            </ModelProvider>
          </ToolsProvider>
        </ApiKeysProvider>
      </PersistenceProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
