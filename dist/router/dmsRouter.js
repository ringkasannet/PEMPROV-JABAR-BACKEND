"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dmsRouter = void 0;
const dms_js_1 = require("../dms.js");
const multer_1 = __importDefault(require("multer"));
const geminiAI_js_1 = require("../geminiAI.js");
const fs_1 = __importDefault(require("fs"));
const express_1 = __importDefault(require("express"));
const mongodb_handler_js_1 = require("../mongodb_handler.js");
const bumdHandler_js_1 = require("../bumdHandler.js");
const asetHandler_js_1 = require("../asetHandler.js");
exports.dmsRouter = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: "uploads/" });
let dataForSubmit = null;
exports.dmsRouter.get("/uploaded", async (req, res) => {
    const files = await (0, geminiAI_js_1.listUploadedFileToGemini)();
    const file = await (0, geminiAI_js_1.getUploadedFileToGemini)("coba");
    if (!file) {
        res.status(404).send("file not found");
    }
    else {
        res.send(file);
    }
});
exports.dmsRouter.post("/extract-perda-bumd", upload.single("file"), async (req, res) => {
    try {
        const file = await (0, geminiAI_js_1.getUploadedFileToGemini)(req.file.originalname);
        if (!file) {
            console.time("upload to gemini");
            const file = await (0, geminiAI_js_1.uploadToGemini)(req.file.path, req.file.originalname);
            // console.log(file);
            await (0, geminiAI_js_1.checkActiveFiles)(file);
            console.timeEnd("upload to gemini");
        }
        else {
            console.log("file already uploaded");
        }
        const descs = [];
        const bumdDescription = await (0, dms_js_1.BUMDExtractor)(file);
        descs.push(bumdDescription);
        res.send(descs);
        //delete file from multer
        fs_1.default.unlink(req.file.path, err => {
            if (err) {
                console.error(err);
                return;
            }
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).send("internal error");
    }
});
exports.dmsRouter.post("/save-perda-bumd", async (req, res) => {
    try {
        console.log("Perda BUMD:", req.body);
        const perdaBUMD = req.body;
        await (0, bumdHandler_js_1.savePerdaBUMD)(perdaBUMD);
        res.send("done");
    }
    catch (error) {
        res.status(500).send("internal error");
    }
});
exports.dmsRouter.get("/clear-all-mongodb", async (req, res) => {
    try {
        await mongodb_handler_js_1.collectionBUMD.deleteMany({});
        res.send("done");
    }
    catch (error) {
        res.status(500).send("internal error");
    }
});
exports.dmsRouter.delete("/perda-bumd", async (req, res) => {
    console.log("removing bumd");
    const chunksID = req.body;
    // console.log(chunksID);
    await (0, bumdHandler_js_1.removeSelectedBUMDs)(chunksID);
    res.send("done");
});
exports.dmsRouter.post("/extract-perda-aset", upload.single("file"), async (req, res) => {
    try {
        console.time("checking file already uploaded");
        const file = await (0, geminiAI_js_1.getUploadedFileToGemini)(req.file.originalname);
        if (!file) {
            console.time("upload to gemini");
            const file = await (0, geminiAI_js_1.uploadToGemini)(req.file.path, req.file.originalname);
            // console.log(file);
            await (0, geminiAI_js_1.checkActiveFiles)(file);
            console.timeEnd("upload to gemini");
        }
        else {
            console.log("file already uploaded");
        }
        console.timeEnd("checking file already uploaded");
        const descs = [];
        console.time("initiation aset extractor");
        const asetDescription = await (0, dms_js_1.asetExtractor)(file);
        descs.push(asetDescription);
        res.send(descs);
        console.timeEnd("initiation aset extractor");
        //delete file from multer
        fs_1.default.unlink(req.file.path, err => {
            if (err) {
                console.error(err);
                return;
            }
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).send("internal error");
    }
});
exports.dmsRouter.post("/save-perda-aset", async (req, res) => {
    try {
        console.log("Perda BUMD:", req.body);
        const perdaBUMD = req.body;
        await (0, asetHandler_js_1.savePerdaAset)(perdaBUMD);
        res.send("done");
    }
    catch (error) {
        res.status(500).send("internal error");
    }
});
exports.dmsRouter.delete("/perda-aset", async (req, res) => {
    console.log("removing bumd");
    const perdas = req.body;
    // console.log(chunksID);
    await (0, asetHandler_js_1.removeSelectedPerdaAset)(perdas);
    res.send("done");
});
//# sourceMappingURL=dmsRouter.js.map