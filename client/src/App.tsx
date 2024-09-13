import React, { useState } from "react";
import "./App.css";

function App(): JSX.Element {
  const [video, setVideo] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Corrected this line
    const uploadEndpoint = "http://localhost:5000/api/video-compression";
    // Handle file upload
    const formData = new FormData();
    formData.append("video", video as Blob);
    const response = await fetch(uploadEndpoint, {
      method: "POST",
      body: formData,
    });
    console.log(response);
  };

  return (
    <main className="App">
      <form onSubmit={handleSubmit}>
        <label htmlFor="video-file">
          <input
            type="file"
            name="video-file"
            id="video-file"
            accept="video/*" // Added to restrict the file input to video files only
            onChange={(e) =>
              setVideo(e.target.files ? e.target.files[0] : null)
            }
          />
        </label>
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}

export default App;
