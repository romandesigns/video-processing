import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World!");
});

router.post("/video-compression", (req, res) => {
  if (!req.files) return;
  console.log(req.files.video);
  res.send("Success");
});

export default router;
