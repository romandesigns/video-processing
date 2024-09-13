import React, { useState } from "react";
import "./App.css";

function App(): JSX.Element {
  const [video, setVideo] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Corrected this line
    console.log(video);
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
