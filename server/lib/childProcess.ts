import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

process.on("message", (payload) => {
  const { tempFilePath, name, originalFilePath } = payload;

  const endProcess = (endPayload) => {
    const { statusCode, text } = endPayload;

    // Send response back to the parent process
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

  // Process video and save it
  ffmpeg(tempFilePath)
    .fps(30) // Keep the original frame rate
    .videoCodec("libx264") // Use H.264 codec for high-quality compression
    .addOptions([
      "-crf 23", // Increase CRF value to reduce file size while maintaining decent quality
      "-preset fast", // Use a faster preset to speed up processing
      "-vf scale=1920:1080", // Scale down the resolution to 1080p
    ])
    .on("progress", (progress) => {
      // Send progress updates to parent process
      process.send({ progress: progress.percent.toFixed(2) });
    })
    .on("end", () => {
      // Remove temp file after processing
      fs.unlink(tempFilePath, (err) => {
        if (err) {
          console.error("Error removing temp file:", err);
          process.send({ statusCode: 500, text: err.message });
        } else {
          console.log("Temp file removed successfully.");
        }
      });

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
      endProcess({ statusCode: 500, text: err.message });
    })
    .save(outputFilePath);
});
