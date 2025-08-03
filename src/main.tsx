import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { ThemeProvider } from "next-themes";
import { ChatProvider } from "./contexts/use-chat/chat-context";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider
      defaultTheme="system"
      attribute="class"
      enableSystem={true}
      storageKey="theme"
    >
      <ChatProvider>
        <App />
      </ChatProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
