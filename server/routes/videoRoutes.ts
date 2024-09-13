import express from "express";
import { fork } from "child_process";
import path from "path";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World!");
});

router.post("/video-compression", (req, res) => {
  if (!req.files) return;
  const video = req.files.video;
  const tempFilePath = video.tempFilePath;
  if (video && tempFilePath) {
    const child = fork(path.resolve("./lib", "childProcess.ts"));
    child.send(tempFilePath);
    child.on("message", (message) => {
      console.log(
        "🚀 ~ file: server.js ~ line 37 ~ child.on ~ message",
        message
      );
    });
    res.send("Success");
  } else {
    res.status(400).send("No file uploaded");
  }
});

export default router;
