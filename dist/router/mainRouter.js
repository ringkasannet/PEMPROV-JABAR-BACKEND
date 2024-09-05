"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const pinecone_js_1 = require("../pinecone.js");
exports.router = express_1.default.Router();
exports.router.get("/", (req, res) => {
    res.send(`halaman root`);
});
exports.router.get("/getAPiKey", (req, res) => {
    res.send(process.env.OPENAI_API_KEY);
});
exports.router.get("/all-vector-ids/:context", async (req, res) => {
    try {
        const vectors = await (0, pinecone_js_1.getAllVector)(req.params.context);
        res.send(vectors);
    }
    catch (error) {
        res.status(404).send(error.message);
    }
});
exports.router.delete("/vector-id/:context", async (req, res) => {
    try {
        await (0, pinecone_js_1.removeOneFromPinecone)(req.body.chunkId, req.params.context);
        res.send("Deleted");
    }
    catch (error) {
        res.status(500).send(error.message);
    }
});
//# sourceMappingURL=mainRouter.js.map