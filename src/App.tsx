import { BrowserRouter, Route, Routes } from "react-router";

import ChatRoute from "@/routes/chat";
import IndexRoute from "@/routes/index";
import SettingsRoute from "@/routes/settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexRoute />} />
        <Route path="/chat" element={<ChatRoute />} />
        <Route path="/chat/:id" element={<ChatRoute />} />
        <Route path="/settings" element={<SettingsRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
