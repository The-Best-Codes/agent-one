import { BrowserRouter, Route, Routes } from "react-router";

import ChatRoute from "@/routes/chat";
import IndexRoute from "@/routes/index";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexRoute />} />
        <Route path="/chat" element={<ChatRoute />} />
        <Route path="/chat/:id" element={<ChatRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
