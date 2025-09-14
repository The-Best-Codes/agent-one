import { BrowserRouter, Route, Routes } from "react-router";

import ChatRoute from "@/routes/chat";
import IndexRoute from "@/routes/index";
import SettingsRoute from "@/routes/settings";
import TestsRoute from "@/routes/tests";
import FnmTestRoute from "@/routes/tests/fnm";

import { KbdRegistry } from "./kbd-shortcuts";

function App() {
  return (
    <BrowserRouter>
      <KbdRegistry />
      <Routes>
        <Route path="/" element={<IndexRoute />} />
        <Route path="/chat" element={<ChatRoute />} />
        <Route path="/chat/:id" element={<ChatRoute />} />
        <Route path="/settings" element={<SettingsRoute />} />
        <Route path="/tests" element={<TestsRoute />} />
        <Route path="/tests/fnm" element={<FnmTestRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
