import { BrowserRouter, Route, Routes } from "react-router";

import ChatRoute from "@/routes/chat";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatRoute />} />
        <Route path="/chat" element={<ChatRoute />} />
        <Route path="/chat/:id" element={<ChatRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
