import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChatProvider } from "./contexts/use-chat/chat-context";
import { ThreadProvider } from "./contexts/use-thread/thread-context";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThreadProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </ThreadProvider>
  </React.StrictMode>,
);
