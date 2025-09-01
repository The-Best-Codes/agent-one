import { MultiChatProvider } from "./contexts/use-chat/multi-chat-context";
import { BrowserRouter, Route, Routes } from "react-router";

import ChatRoute from "@/routes/chat";
import IndexRoute from "@/routes/index";

function App() {
  return (
    <BrowserRouter>
      <MultiChatProvider>
        <Routes>
          <Route path="/" element={<IndexRoute />} />
          <Route path="/chat" element={<ChatRoute />} />
          <Route path="/chat/:id" element={<ChatRoute />} />
        </Routes>
      </MultiChatProvider>
    </BrowserRouter>
  );
}

export default App;
