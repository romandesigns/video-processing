import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { v4 as uuidv4 } from "uuid"; // Import UUID to generate unique IDs

process.on("message", (payload) => {
  const { tempFilePath, name } = payload;

  const endProcess = (endPayload) => {
    const { statusCode, text } = endPayload;

    // Send response back to parent process
    process.send({ statusCode, text });

    // End process
    process.exit();
  };

  // Define the temporary output path within the "temp" directory
  const tempOutputDir = path.join(process.cwd(), "temp");
  const tempOutputFilePath = path.join(
    tempOutputDir,
    `${new Date().getTime()}-${name}`
  );

  // Measure the compression time
  const startTime = Date.now();

  // Step 1: Get the original video resolution
  ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
    if (err) {
      endProcess({ statusCode: 500, text: err.message });
      return;
    }

    const originalVideoStream = metadata.streams.find(
      (stream) => stream.codec_type === "video"
    );

    const originalWidth = originalVideoStream.width;
    const originalHeight = originalVideoStream.height;
    const originalResolution = `${originalWidth}x${originalHeight}`;

    // Step 2: Process video and save it to the temp directory
    ffmpeg(tempFilePath)
      .fps(30) // Keep the original frame rate
      .videoCodec("libx264") // Use H.264 codec for high-quality compression
      .addOptions([
        "-crf 23", // Increase CRF value to reduce file size while maintaining decent quality
        "-preset fast", // Use a faster preset to speed up processing
        "-vf scale=1280:720", // Scale down the resolution to 720p
      ])
      .on("progress", (progress) => {
        // Send progress updates to parent process
        process.send({ progress: progress.percent.toFixed(2) });
      })
      .on("end", () => {
        // Calculate the time taken for compression
        const endTime = Date.now();
        const compressionTime = ((endTime - startTime) / 1000).toFixed(2); // Time in seconds

        // Get the sizes of the original and compressed files
        try {
          const originalSize = fs.statSync(tempFilePath).size;
          const compressedSize = fs.statSync(tempOutputFilePath).size;
          const reductionPercentage =
            ((originalSize - compressedSize) / originalSize) * 100;

          // Step 3: Get the resolution of the compressed video
          ffmpeg.ffprobe(tempOutputFilePath, (err, metadata) => {
            if (err) {
              endProcess({ statusCode: 500, text: err.message });
              return;
            }

            const compressedVideoStream = metadata.streams.find(
              (stream) => stream.codec_type === "video"
            );

            const compressedWidth = compressedVideoStream.width;
            const compressedHeight = compressedVideoStream.height;
            const compressedResolution = `${compressedWidth}x${compressedHeight}`;

            // Step 4: Move the compressed video to the "compressed" directory
            const compressedDir = path.join(process.cwd(), "compressed");
            if (!fs.existsSync(compressedDir)) {
              fs.mkdirSync(compressedDir); // Create the "compressed" folder if it doesn't exist
            }

            const finalOutputFilePath = path.join(
              compressedDir,
              `${new Date().getTime()}-${name}`
            );

            // Move the file to the "compressed" directory
            fs.rename(tempOutputFilePath, finalOutputFilePath, (err) => {
              if (err) {
                endProcess({
                  statusCode: 500,
                  text: `Failed to move file: ${err.message}`,
                });
                return;
              }

              // Generate a unique ID for the video file
              const videoId = uuidv4();

              // Prepare video metadata
              const videoInfo = {
                id: videoId,
                originalName: name,
                originalSize,
                compressedSize,
                compressionDate: new Date().toISOString(),
                reductionPercentage: reductionPercentage.toFixed(2),
                outputPath: finalOutputFilePath,
                originalResolution, // Original resolution
                compressedResolution, // Compressed resolution
                compressionTime: `${compressionTime} seconds`, // Compression time
              };

              console.log(
                "Video compressed and moved successfully. File saved at",
                finalOutputFilePath
              );

              // Remove temp file
              fs.unlink(tempFilePath, (err) => {
                if (err) {
                  process.send({ statusCode: 500, text: err.message });
                  process.exit();
                } else {
                  console.log("Temp file removed successfully.");

                  // Path to the JSON file
                  const jsonPath = path.join(
                    process.cwd(),
                    "data",
                    "videoInfo.json"
                  );

                  // Read existing data, if any
                  let videoData = { compressedVideos: [] };
                  try {
                    videoData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
                  } catch (err) {
                    console.log("Creating new videoInfo.json file.");
                  }

                  // Append new video info
                  videoData.compressedVideos.push(videoInfo);
                  fs.writeFileSync(
                    jsonPath,
                    JSON.stringify(videoData, null, 2)
                  );

                  // Notify parent process of the updated video data
                  process.send({
                    statusCode: 200,
                    text: `Video compressed and moved successfully. File saved at ${finalOutputFilePath}`,
                    updatedVideoInfo: videoData, // Send the updated video data
                  });
                }
              });
            });
          });
        } catch (err) {
          endProcess({ statusCode: 500, text: err.message });
        }
      })
      .on("error", (err) => {
        endProcess({ statusCode: 500, text: err.message });
      })
      .save(tempOutputFilePath);
  });
});
