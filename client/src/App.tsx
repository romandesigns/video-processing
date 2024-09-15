import { Route, Routes } from "react-router-dom";
import HomePage from "./page/HomePage";
import VideosCompressedPage from "./page/CompressedVideosPage";
import NotFoundPage from "./page/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route index path="/" element={<HomePage />} />
      <Route
        index
        path="/compressed-videos"
        element={<VideosCompressedPage />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
