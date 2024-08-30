import { BUMDExtractor } from "../dms.js";
import multer from "multer";

import express from "express";
export const dmsRouter = express.Router();
const upload = multer({ dest: "uploads/" });

dmsRouter.post("/perda-bumd", upload.single("perda"), (req, res) => {
  console.log(req.file);
  res.send("ok");
});

dmsRouter.get("/localToGemini", async (req, res) => {
  const pdfFile = './public/bumd/Peraturan Daerah Provinsi Jawa Barat Nomor 3 Tahun 2022.pdf';
  const result = await BUMDExtractor(pdfFile);
  
  res.send(result);
});
