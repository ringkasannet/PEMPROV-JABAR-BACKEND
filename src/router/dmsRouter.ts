import { asetExtractor, BUMDExtractor } from "../dms.js";
import multer from "multer";
import {
    uploadToGemini,
    checkActiveFiles,
    getUploadedFileToGemini,
    listUploadedFileToGemini,
} from "../geminiAI.js";
import fs from "fs";
import express from "express";
import { collectionBUMD } from "../mongodb_handler.js";
import { removeSelectedBUMDs, savePerdaBUMD } from "../bumdHandler.js";
import { removeSelectedPerdaAset, savePerdaAset } from "../asetHandler.js";
export const dmsRouter = express.Router();
const upload = multer({ dest: "uploads/" });

let dataForSubmit: any = null;

dmsRouter.get("/uploaded", async (req, res) => {
    const files = await listUploadedFileToGemini();
    const file = await getUploadedFileToGemini("coba");
    if (!file) {
        res.status(404).send("file not found");
    } else {
        res.send(file);
    }
});
dmsRouter.post(
    "/extract-perda-bumd",
    upload.single("file"),
    async (req, res) => {
        try {
            const file = await getUploadedFileToGemini(req.file.originalname);
            if (!file) {
                console.time("upload to gemini");
                const file = await uploadToGemini(
                    req.file.path,
                    req.file.originalname,
                );
                // console.log(file);
                await checkActiveFiles(file);
                console.timeEnd("upload to gemini");
            } else {
                console.log("file already uploaded");
            }
            const descs = [];
            const bumdDescription = await BUMDExtractor(file);
            descs.push(bumdDescription);
            res.send(descs);
            //delete file from multer
            fs.unlink(req.file.path, err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        } catch (error) {
            console.log(error);
            res.status(500).send("internal error");
        }
    },
);

dmsRouter.post("/save-perda-bumd", async (req, res) => {
    try {
        console.log("Perda BUMD:", req.body);
        const perdaBUMD = req.body;
        await savePerdaBUMD(perdaBUMD);
        res.send("done");
    } catch (error) {
        res.status(500).send("internal error");
    }
});

dmsRouter.get("/clear-all-mongodb", async (req, res) => {
    try {
        await collectionBUMD.deleteMany({});
        res.send("done");
    } catch (error) {
        res.status(500).send("internal error");
    }
});

dmsRouter.delete("/perda-bumd", async (req, res) => {
    console.log("removing bumd");

    const chunksID = req.body;
    // console.log(chunksID);

    await removeSelectedBUMDs(chunksID);

    res.send("done");
});

dmsRouter.post(
    "/extract-perda-aset",
    upload.single("file"),
    async (req, res) => {
        try {
            console.log("in extract perda aset");
            console.time("checking file already uploaded");
            const file = await getUploadedFileToGemini(req.file.originalname);
            if (!file) {
                console.time("upload to gemini");
                const file = await uploadToGemini(
                    req.file.path,
                    req.file.originalname,
                );
                // console.log(file);
                await checkActiveFiles(file);
                console.timeEnd("upload to gemini");
            } else {
                console.log("file already uploaded");
            }
            console.timeEnd("checking file already uploaded");
            const descs = [];
            console.time("initiation aset extractor")
            const asetDescription = await asetExtractor(file);
            descs.push(asetDescription);
            res.send(descs);
            console.timeEnd("initiation aset extractor")
            //delete file from multer
            fs.unlink(req.file.path, err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        } catch (error) {
            console.log(error);
            res.status(500).send("internal error");
        }
    },
);

dmsRouter.post("/save-perda-aset", async (req, res) => {
    try {
        console.log("Perda BUMD:", req.body);
        const perdaBUMD = req.body;
        await savePerdaAset(perdaBUMD);
        res.send("done");
    } catch (error) {
        res.status(500).send("internal error");
    }
});

dmsRouter.delete("/perda-aset", async (req, res) => {
    console.log("removing bumd");

    const perdas = req.body;
    // console.log(chunksID);

    await removeSelectedPerdaAset(perdas);

    res.send("done");
});
