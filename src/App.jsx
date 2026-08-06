import { BrowserRouter, Routes, Route } from "react-router-dom";

import IndexPage from "./pages/IndexPage/IndexPage";
import LoginTemplate from "./pages/LoginPage/LoginTemplate";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/signup" element={<LoginTemplate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;