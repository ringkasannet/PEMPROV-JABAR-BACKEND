import { BUMDExtractor } from "../dms.js";
import multer from "multer";
import { uploadToGemini, checkActiveFiles } from "../geminiAI.js";

import express from "express";
export const dmsRouter = express.Router();
const upload = multer({ dest: "uploads/" });

dmsRouter.post("/perda-bumd", upload.single("perda"), (req, res) => {
  console.log(req.file);
  res.send("ok");
});

dmsRouter.post("/extract-perda-bumd", async (req, res) => {
  const pdfFile =
    "./public/bumd/Peraturan Daerah Provinsi Jawa Barat Nomor 3 Tahun 2022.pdf";
  try {
    const file = await uploadToGemini(pdfFile);
    // console.log(file);
    await checkActiveFiles(file);
    console.log("file uploaded to gemini");
    const descs = [];
    const bumdDescription = await BUMDExtractor(file);
    descs.push(bumdDescription);
    console.log("iteration", i, bumdDescription);
    res.send(descs);
  } catch (error) {
    console.log(error);
    res.status(500).send("internal error");
  }
});
