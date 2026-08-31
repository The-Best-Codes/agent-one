import "zod/compile";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";

import "@/lib/i18n";
import ErrorBoundary from "@/components/error-boundary";
import { ThemeRegistry } from "@/components/theme/theme-registry";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiKeysProvider } from "@/contexts/use-api-keys/api-keys-context";
import { ModelProvider } from "@/contexts/use-model/model-context";
import { PersistenceProvider } from "@/contexts/use-persistence/persistence-context";
import { ToolsProvider } from "@/contexts/use-tools/tools-context";
import { UpdateProvider } from "@/contexts/use-update/update-context";
import { WebAuthProvider } from "@/contexts/use-web-auth/web-auth-context";
import SuspenseFallback from "@/routes/suspense-fallback";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeRegistry />
      <WebAuthProvider>
        <PersistenceProvider>
          <ApiKeysProvider>
            <ToolsProvider>
              <ModelProvider>
                <UpdateProvider>
                  <Suspense fallback={<SuspenseFallback />}>
                    <TooltipProvider>
                      <App />
                    </TooltipProvider>
                  </Suspense>
                </UpdateProvider>
              </ModelProvider>
            </ToolsProvider>
          </ApiKeysProvider>
        </PersistenceProvider>
      </WebAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
