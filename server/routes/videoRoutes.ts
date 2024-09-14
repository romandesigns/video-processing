import express from "express";
import { fork } from "child_process";
import path from "path";
import fs from "fs";

const router = express.Router();
const videoInfoPath = path.join(process.cwd() + "/data/", "videoInfo.json");
const clients: any[] = []; // Array to hold all connected clients for SSE

// Handle progress updates using Server-Sent Events (SSE)
router.get("/progress", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.push(res); // Add this client to the list

  // Remove client from the list when the connection closes
  req.on("close", () => {
    clients.splice(clients.indexOf(res), 1);
  });
});

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
    const stat = fs.statSync(filePath);

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", stat.size);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);

    readStream.on("error", (err) => {
      console.error("Error while reading the file:", err);
      res
        .status(500)
        .json({ error: "Error occurred while downloading the file." });
    });
  } else {
    res.status(404).json({ error: "File not found." });
  }
});

router.post("/video-compression", (req, res) => {
  if (!req.files) return;
  const video = req.files.video;
  const tempFilePath = video.tempFilePath;
  if (video && tempFilePath) {
    const child = fork(path.resolve("./lib", "childProcess.ts"));
    child.send({ tempFilePath, name: video.name });

    // Listen for messages from the child process
    child.on("message", (message) => {
      const { statusCode, text, progress } = message;

      if (progress !== undefined) {
        // Send progress updates to all connected clients
        clients.forEach((client) =>
          client.write(`data: ${JSON.stringify({ percent: progress })}\n\n`)
        );
      } else {
        res.status(statusCode).json({ message: text });
      }
    });

    res.json({ message: "Processing started." });
  } else {
    res.status(400).json({ message: "No file uploaded" });
  }
});

export default router;
