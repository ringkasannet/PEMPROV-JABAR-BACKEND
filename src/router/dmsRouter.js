import { BUMDExtractor } from "../dms.js";
import multer from "multer";

import express from "express";
export const dmsRouter = express.Router();
const upload = multer({ dest: "uploads/" });

dmsRouter.post("/perda-bumd", upload.single("perda"), (req, res) => {
  console.log(req.file);
  res.send("ok");
});

dmsRouter.get("/localToGemini", (req, res) => {
  // const result = await BUMDExtractor();
  re;
});
