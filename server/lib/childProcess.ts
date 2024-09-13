import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

process.on("message", (payload) => {
  const { tempFilePath, name } = payload;

  const endProcess = (endPayload) => {
    const { statusCode, text } = endPayload;

    // Remove temp file
    fs.unlink(tempFilePath, (err) => {
      if (err) {
        process.send({ statusCode: 500, text: err.message });
      }
    });

    // Send response back to parent process
    process.send({ statusCode, text });

    // End process
    process.exit();
  };

  // Determine the output directory by using the directory of the original file
  const originalFileDir = path.dirname(tempFilePath);

  // Define the output path for the processed video
  const outputFilePath = path.join(originalFileDir, `compressed_${name}`);

  // Process video and send back the result
  ffmpeg(tempFilePath)
    .fps(30)
    .addOptions(["-crf 28"])
    .on("end", () => {
      endProcess({ statusCode: 200, text: "Success" });
    })
    .on("error", (err) => {
      endProcess({ statusCode: 500, text: err.message });
    })
    .save(outputFilePath); // Save to the same directory as the original file
});
