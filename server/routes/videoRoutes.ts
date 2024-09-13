import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World!");
});

router.post("/video-compression", (req, res) => {
  res.send("Hello World!");
});

export default router;
