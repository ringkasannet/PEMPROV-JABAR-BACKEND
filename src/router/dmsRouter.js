import { BUMDExtractor } from "../dms.js";
import multer from "multer";
import { uploadToGemini, checkActiveFiles } from "../geminiAI.js";

import express from "express";
import { collectionBUMD } from "../mongodb_handler.js";
export const dmsRouter = express.Router();
const upload = multer({ dest: "uploads/" });

dmsRouter.post("/perda-bumd", upload.single("perda"), (req, res) => {
  console.log(req.file);
  res.send("ok");
});

let dataForSubmit = null;

dmsRouter.post("/extract-perda-bumd", async (req, res) => {
  // const pdfFile = "./public/bumd/Perda No. 26 Tahun 2001.pdf";
  const pdfFile = "./public/bumd/Peraturan Daerah Provinsi Jawa Barat Nomor 3 Tahun 2022.pdf";
  // const pdfFile = "./public/bumd/Peraturan Daerah Provinsi Jawa Barat Nomor 7 Tahun 2021.pdf";
  dataForSubmit = {};
  try {
    const file = await uploadToGemini(pdfFile);
    // console.log(file);
    await checkActiveFiles(file);
    console.log("file uploaded to Gemini");
    
    const bumdDescription = await BUMDExtractor(file);
    dataForSubmit = bumdDescription;
    res.send(dataForSubmit.desc);
  } catch (error) {
    console.log(error);
    res.status(500).send("internal error");
  };
});

dmsRouter.post('/submit-perda-bumd', async (req, res) => {
  try {
    if(dataForSubmit === null || !dataForSubmit){
      res.send('Silahkan upload ulang file anda: data is NULL!');
    } else {
      console.log(`uploads ${dataForSubmit.perda} to mongodb...`);
      await collectionBUMD.insertOne(dataForSubmit);
      res.send(dataForSubmit);
      dataForSubmit = null;
    };
  } catch (error) {
    res.status(500).send('internal error');
  };
});

dmsRouter.get('/clear-all-mongodb', async (req, res) => {
  try {
    await collectionBUMD.deleteMany({});
    res.send('done');
  } catch (error) {
    res.status(500).send('internal error');
  };
});