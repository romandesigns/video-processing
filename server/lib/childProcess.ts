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
  const outputFilePath = path.join(outputDir, `compressed_${name}`);

  // Process video and save it
  ffmpeg(tempFilePath)
    .fps(30)
    .addOptions(["-crf 28"])
    .on("end", () => {
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
