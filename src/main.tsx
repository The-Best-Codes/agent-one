import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChatProvider } from "./contexts/chat-context";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChatProvider>
      <App />
    </ChatProvider>
  </React.StrictMode>,
);
