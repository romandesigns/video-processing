import express from "express";
import { fork } from "child_process";
import path from "path";
import fs from "fs";

const router = express.Router();
const videoInfoPath = path.join(process.cwd() + "/data/", "videoInfo.json");

router.get("/videos", (req, res) => {
  try {
    if (!fs.existsSync(videoInfoPath)) {
      fs.writeFileSync(
        videoInfoPath,
        JSON.stringify({ compressedVideos: [] }, null, 2)
      );
    }
    const videoData = JSON.parse(fs.readFileSync(videoInfoPath, "utf8"));
    if (videoData) {
      res.json({ videos: videoData.compressedVideos });
    } else {
      res.status(404).json({ error: "No video data found." });
    }
  } catch (error) {
    console.error("Error fetching video data:", error);
    res.status(500).json({ error: "Failed to fetch video data." });
  }
});

router.get("/download/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(process.cwd(), "temp", fileName);
  if (fs.existsSync(filePath)) {
    res.download(filePath, (err) => {
      if (err) {
        res
          .status(500)
          .json({ error: "Error occurred while downloading the file." });
      }
    });
  } else {
    res.status(404).json({ error: "File not found." });
  }
});

router.post("/video-compression", (req, res) => {
  if (!req.files) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const video = req.files.video;
  const tempFilePath = video.tempFilePath;
  const originalFilePath = path.dirname(tempFilePath);

  if (video && tempFilePath) {
    const child = fork(path.resolve("./lib", "childProcess.ts"));

    // Send temp file path, original directory path, and video name to the child process
    child.send({ tempFilePath, name: video.name, originalFilePath });

    // Listen for messages from the child process
    child.on("message", (message) => {
      const { statusCode, text } = message;
      res.status(statusCode).json({
        status: statusCode === 200 ? "success" : "error",
        message: text,
      });
    });

    // Error handling
    child.on("error", (err) => {
      console.error("Child process error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    });

    child.on("exit", (code) => {
      console.log(`Child process exited with code ${code}`);
    });
  } else {
    res.status(400).json({ error: "No file uploaded" });
  }
});

export default router;
