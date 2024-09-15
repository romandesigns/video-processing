import React, { useState, useEffect } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import "./Home.module.css";

function Home() {
  const [video, setVideo] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const serverHost = process.env.REACT_APP_SERVER_HOST;
  const navigate = useNavigate();

  useEffect(() => {
    const eventSource = new EventSource(`${serverHost}/api/progress`);
    eventSource.onmessage = (event) => {
      const eventData = JSON.parse(event.data);
      if (eventData.percent !== undefined) {
        setProgress(eventData.percent);
      }
    };
    return () => {
      eventSource.close();
    };
  }, [serverHost]);

  useEffect(() => {
    if (Math.round(progress) === 100) {
      setProgress(0);
      navigate("/compressed-videos");
    }
  }, [progress, navigate]);

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
        console.log(data.message);
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
      <div>
        <h2>Progress</h2>
        <progress value={progress} max="100"></progress>
        <p>{Math.round(progress)}% done</p>
      </div>
    </main>
  );
}

export default Home;
