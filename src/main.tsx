import ErrorBoundary from "@/components/error-boundary";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { ChatProvider } from "@/contexts/use-chat/chat-context";
import { ModelProvider } from "@/contexts/use-model/model-context";
import { ThemeProvider } from "next-themes";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="system"
        attribute="class"
        enableSystem={true}
        storageKey="theme"
      >
        <ModelProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </ModelProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
