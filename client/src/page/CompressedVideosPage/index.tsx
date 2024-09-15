import moment from "moment";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CompressedVideosPage.module.css";

function CompressedVideosPage() {
  const [convertedVideos, setConvertedVideos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null); // State to store error messages

  const serverHost = process.env.REACT_APP_SERVER_HOST;
  const navigate = useNavigate(); // Hook for navigation

  function bytesToMB(bytes: number) {
    const MB = bytes / (1024 * 1024);
    return MB.toFixed(2); // Keeps two decimal places
  }

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(`${serverHost}/api/videos`, {
          cache: "no-cache",
        });

        if (!response.ok) {
          throw new Error(`Error fetching videos: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Received response is not JSON");
        }

        const data = await response.json();

        if (data && Array.isArray(data.videos)) {
          setConvertedVideos(data.videos);
        } else {
          console.error("Unexpected data format:", data);
          setError("Unexpected data format received from server.");
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
        setError("Error fetching videos from the server.");
      }
    };
    fetchVideos();
  }, [serverHost]);

  const handleDownload = (video) => {
    // Perform a full page reload to ensure the latest data is fetched
    window.location.href = `${serverHost}/api/download/${video.outputPath
      .split("/")
      .pop()}`;
  };

  return (
    <main className="App">
      <h2>Converted Videos</h2>
      {error && <p className="error">{error}</p>}{" "}
      {/* Display error if exists */}
      {convertedVideos.length > 0 ? (
        <ul>
          {convertedVideos.map((video) => (
            <li key={video.id}>
              <p>Name: {video.originalName}</p>
              <p>Original Size: {bytesToMB(video.originalSize)} MB</p>
              <p>Compressed Size: {bytesToMB(video.compressedSize)} MB</p>
              <p>Original Resolution: {video.originalResolution}</p>
              <p>Compressed Resolution: {video.compressedResolution}</p>
              <p>Reduction: {Math.round(video.reductionPercentage)}%</p>
              <p>Duration: {video.compressionTime}</p>
              <p>
                Compression Date:{" "}
                {moment(video.compressionDate).format("MM-DD-YYYY")}
              </p>
              <button onClick={() => handleDownload(video)}>Download</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No videos converted yet.</p>
      )}
    </main>
  );
}

export default CompressedVideosPage;
