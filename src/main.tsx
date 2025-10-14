import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";

import ErrorBoundary from "@/components/error-boundary";
import { ThemeRegistry } from "@/components/theme/theme-registry";
import { ModelProvider } from "@/contexts/use-model/model-context";
import { PersistenceProvider } from "@/contexts/use-persistence/persistence-context";
import SuspenseFallback from "@/routes/suspense-fallback";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeRegistry />
      <PersistenceProvider>
        <ModelProvider>
          <Suspense fallback={<SuspenseFallback />}>
            <App />
          </Suspense>
        </ModelProvider>
      </PersistenceProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
