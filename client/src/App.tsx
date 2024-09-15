import { Route, Routes } from "react-router-dom";
import Home from "./page/Home";
import NotFound from "./page/NotFound";

function App() {
  return (
    <Routes>
      <Route index path="/" element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
