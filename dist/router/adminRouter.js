"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = __importDefault(require("express"));
const asetHandler_1 = require("../asetHandler");
const asetHandler_2 = require("../asetHandler");
exports.adminRouter = express_1.default.Router();
// input Aset
exports.adminRouter.post("/admin/inputAset", async (req, res) => {
    console.log("halaman /admin/inputAset");
    const dataInput = req.body;
    // console.log(dataInput);
    await (0, asetHandler_2.inputDataAsetObject)(dataInput);
    res.send('done');
});
// hapus Aset chunk
exports.adminRouter.post("/admin/removeSelectedAsetChunks", async (req, res) => {
    console.log("halaman /admin/removeSelectedAsetChunks");
    const chunksID = req.body;
    // console.log(chunksID);
    await (0, asetHandler_1.removeSelectedAsetChunks)(chunksID);
    res.send('done');
});
//# sourceMappingURL=adminRouter.js.map