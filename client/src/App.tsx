import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [video, setVideo] = useState<File | null>(null);
  const [convertedVideos, setConvertedVideos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null); // State to store error messages

  const serverHost = process.env.REACT_APP_SERVER_HOST;

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${serverHost}/api/videos`, {
        cache: "no-cache",
      });

      // Check if the response is OK and is in JSON format
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

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    if (video) {
      formData.append("video", video);

      try {
        const response = await fetch(`${serverHost}/api/video-compression`, {
          method: "POST",
          body: formData,
        });

        // Check if the response is OK
        if (!response.ok) {
          throw new Error(`Error uploading video: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);

        // After successful upload, re-fetch the list of converted videos
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error("Error uploading video:", error);
        setError("Failed to upload video.");
      }
    }
  };

  return (
    <main className="App">
      <form onSubmit={handleSubmit}>
        <label htmlFor="video-file">
          <input
            type="file"
            name="video-file"
            id="video-file"
            accept="video/*"
            onChange={(e) =>
              setVideo(e.target.files ? e.target.files[0] : null)
            }
          />
        </label>
        <button type="submit">Submit</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Converted Videos</h2>
      {convertedVideos.length > 0 ? (
        <ul>
          {convertedVideos.map((video) => (
            <li key={video.outputPath}>
              <p>Name: {video.originalName}</p>
              <p>Original Size: {video.originalSize} bytes</p>
              <p>Compressed Size: {video.compressedSize} bytes</p>
              <p>Reduction: {video.reductionPercentage}%</p>
              <a
                href={`${serverHost}/api/download/${video.outputPath
                  .split("/")
                  .pop()}`}
                download
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>No videos converted yet.</p>
      )}
    </main>
  );
}

export default App;
