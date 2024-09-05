"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bumdRouter = void 0;
const express_1 = __importDefault(require("express"));
const bumdHandler_1 = require("../bumdHandler");
const geminiAI_1 = require("../geminiAI");
exports.bumdRouter = express_1.default.Router();
exports.bumdRouter.get("/all", async (req, res) => {
    console.log(`halaman getAllBUMD`);
    const listBUMD = await (0, bumdHandler_1.getAllBUMD)();
    res.send(listBUMD);
});
exports.bumdRouter.get("/getAllBUMDID", async (req, res) => {
    console.log(`halaman getAllBUMDID`);
    const listBUMD = await (0, bumdHandler_1.getAllBUMD)();
    const listBUMDID = listBUMD.map(item => {
        return item._id;
    });
    res.send(listBUMDID);
});
exports.bumdRouter.get("/processEmbeddings", async (req, res) => {
    console.log(`halaman processEmbeddings`);
    try {
        const embeddedDoc = await (0, bumdHandler_1.processEmbeddings)();
        console.log(`got docs: ${embeddedDoc}`);
        res.send(embeddedDoc);
    }
    catch (error) {
        // res.status(500).send(error);
    }
});
exports.bumdRouter.post("/askQuestion/:query/:model", async (req, res) => {
    console.log("halaman /askQuestion/:query:", req.body.query, req.params.model);
    try {
        const queryResults = await (0, bumdHandler_1.processQuery)(req.body.query, 5, req.params.model); //TODO sanitasi query
        res.send(queryResults);
    }
    catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});
exports.bumdRouter.post("/candidates/:num", async (req, res) => {
    console.log("In /getBUMDCandidate query:", req.body.query, req.params.num);
    if (!req.body.query) {
        res.status(400).send({ message: "query tidak boleh kosong" });
        return;
    }
    try {
        const queryResults = await (0, bumdHandler_1.getBUMDCandidate)(req.body.query, Number(req.params.num)); //TODO sanitasi query
        res.send(queryResults);
    }
    catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});
exports.bumdRouter.post("/evaluasi/:bumdId/:model", async (req, res) => {
    var _a, e_1, _b, _c, _d, e_2, _e, _f;
    // console.log(req.body)
    // res.send(req.body)
    try {
        console.debug("in evaluasiBUMD, retrieving data from mongodb for bumd:", req.params.bumdId, " query: ", req.body.query);
        const bumd = await (0, bumdHandler_1.getBumdFromId)(req.params.bumdId);
        console.log("got bumd:", bumd[0].name);
        switch (req.params.model) {
            case "OpenAi":
                const streamOpenAi = await (0, bumdHandler_1.evaluasiBUMD)(req.body.query, bumd[0]);
                try {
                    for (var _g = true, streamOpenAi_1 = __asyncValues(streamOpenAi), streamOpenAi_1_1; streamOpenAi_1_1 = await streamOpenAi_1.next(), _a = streamOpenAi_1_1.done, !_a;) {
                        _c = streamOpenAi_1_1.value;
                        _g = false;
                        try {
                            const chunk = _c;
                            if (chunk.choices[0].delta.content) {
                                res.write(chunk.choices[0].delta.content);
                            }
                            else {
                            }
                        }
                        finally {
                            _g = true;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_g && !_a && (_b = streamOpenAi_1.return)) await _b.call(streamOpenAi_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                break;
            case "GeminiAi":
                const streamGemini = await (0, geminiAI_1.evaluasiBUMDPrompt)(req.body.query, bumd[0]);
                try {
                    for (var _h = true, _j = __asyncValues(streamGemini.stream), _k; _k = await _j.next(), _d = _k.done, !_d;) {
                        _f = _k.value;
                        _h = false;
                        try {
                            const chunk = _f;
                            const chunkText = chunk.text();
                            res.write(chunkText);
                        }
                        finally {
                            _h = true;
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (!_h && !_d && (_e = _j.return)) await _e.call(_j);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                break;
            default:
                break;
        }
        // const streamOpenAi = await evaluasiBUMD(req.params.query, bumd[0]);
        // for await (const chunk of streamOpenAi) {
        //   // console.log(chunk.choices[0].delta.content);
        //   // console.info("chunk.choices[0].delta.content");
        //   if (chunk.choices[0].delta.content) {
        //     res.write(chunk.choices[0].delta.content);
        //     // res.write("halo");
        //   } else {
        //   }
        // }
        // res.end("done");
    }
    catch (error) {
        console.error("ditemukan error:", error);
        if ((req.params.model = "GeminiAi"))
            res.status(400).send({ message: await error.message });
        else
            res.status(400).send(error);
    }
});
exports.bumdRouter.get("/addProperty/:propName/:propValue", (req, res) => {
    (0, bumdHandler_1.addPropertyMongoDb)(req.params.propName, req.params.propValue);
    res.status(200).send("ok");
});
//# sourceMappingURL=bumdRouter.js.map