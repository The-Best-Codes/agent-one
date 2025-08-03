import { BrowserRouter, Route, Routes } from "react-router";

import HomeRoute from "@/routes/home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
