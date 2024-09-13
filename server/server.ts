// Server Dependencies
import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
// Routes
import videoRoutes from "./routes/videoRoutes";

// Server Instance
const app = express();
// Server Port
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    tempFileDir: "temp",
    useTempFiles: true,
  })
);

// Routes Middleware
app.use("/api", videoRoutes);

// Start server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
