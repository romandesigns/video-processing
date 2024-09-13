import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

process.on("message", (payload) => {
  const { tempFilePath, name, originalFilePath } = payload;

  const endProcess = (endPayload) => {
    const { statusCode, text } = endPayload;

    // Remove temp file
    fs.unlink(tempFilePath, (err) => {
      if (err) {
        process.send({ statusCode: 500, text: err.message });
        process.exit();
      }
    });

    // Send response back to parent process
    process.send({ statusCode, text });

    // End process
    process.exit();
  };

  // Define the output path within the "temp" directory
  const outputDir = path.join(process.cwd(), "temp"); // Ensure output is in the "temp" directory
  const outputFilePath = path.join(
    outputDir,
    `${new Date().getTime()}-${name}`
  );

  console.log("Starting video compression...");

  // Simplified FFmpeg command
  ffmpeg(tempFilePath)
    .fps(30) // Set frame rate to 30 fps
    .videoCodec("libx264") // Use H.264 codec for high-quality compression
    .addOptions([
      "-crf 23", // Adjust CRF for faster encoding while maintaining good quality
      "-preset medium", // Use a medium preset for a balance between speed and compression
    ])
    .on("start", (commandLine) => {
      console.log("Spawned FFmpeg with command: " + commandLine);
    })
    .on("progress", (progress) => {
      console.log(`Processing: ${progress.percent}% done`);
    })
    .on("end", () => {
      console.log("Video compression completed.");

      // Get original and compressed file sizes
      const originalSize = fs.statSync(originalFilePath).size;
      const compressedSize = fs.statSync(outputFilePath).size;
      const reductionPercentage =
        ((originalSize - compressedSize) / originalSize) * 100;

      // Save metadata to videoInfo.json
      const videoInfo = {
        originalName: name,
        originalSize,
        compressedSize,
        reductionPercentage: reductionPercentage.toFixed(2),
        outputPath: outputFilePath,
      };

      console.log(
        "Video compressed successfully. File saved at",
        outputFilePath
      );

      // Path to the JSON file
      const jsonPath = path.join(process.cwd(), "data", "videoInfo.json");

      // Read existing data, if any
      let videoData = { compressedVideos: [] };
      try {
        videoData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      } catch (err) {
        console.log("Creating new videoInfo.json file.");
      }

      // Append new video info
      videoData.compressedVideos.push(videoInfo);
      fs.writeFileSync(jsonPath, JSON.stringify(videoData, null, 2));

      endProcess({
        statusCode: 200,
        text: `Video compressed successfully. File saved at ${outputFilePath}`,
      });
    })
    .on("error", (err) => {
      console.error("Error during video compression:", err.message);
      endProcess({ statusCode: 500, text: err.message });
    })
    .save(outputFilePath);
});
