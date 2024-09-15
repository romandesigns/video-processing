import React, { useState, useEffect } from "react";
import moment from "moment";
import "./Home.module.css";

function Home() {
  const [video, setVideo] = useState<File | null>(null);
  const [convertedVideos, setConvertedVideos] = useState<any[]>([]);
  const [progress, setProgress] = useState<number>(0); // State to store progress
  const [error, setError] = useState<string | null>(null); // State to store error messages

  const serverHost = process.env.REACT_APP_SERVER_HOST;

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

  function bytesToMB(bytes: number) {
    const MB = bytes / (1024 * 1024);
    return MB.toFixed(2); // Keeps two decimal places
  }

  useEffect(() => {
    fetchVideos();

    // Listen for progress updates and updated video info using Server-Sent Events (SSE)
    const eventSource = new EventSource(`${serverHost}/api/progress`);

    eventSource.onmessage = (event) => {
      const eventData = JSON.parse(event.data);

      // Check if the incoming message is progress or updated video info
      if (eventData.percent !== undefined) {
        // Update progress
        setProgress(eventData.percent);
      } else if (eventData.videos !== undefined) {
        // Update the video list with the new data
        setConvertedVideos(eventData.videos);
      }
    };

    // Clean up EventSource when the component is unmounted
    return () => {
      eventSource.close();
    };
  }, [serverHost]);

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

        if (!response.ok) {
          throw new Error(`Error uploading video: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data.message); // Should display "Processing started."

        // Start listening to progress updates after initiating the upload
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

      {/* Display the progress bar */}
      <div>
        <h2>Progress</h2>
        <progress value={progress} max="100"></progress>
        <p>{Math.round(progress)}% done</p>
      </div>

      <h2>Converted Videos</h2>
      {convertedVideos.length > 0 ? (
        <ul>
          {convertedVideos.map((video) => (
            <li key={video.id}>
              {" "}
              {/* Updated to use unique id */}
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

export default Home;
