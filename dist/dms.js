"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asetExtractor = exports.BUMDExtractor = void 0;
const geminiAI_js_1 = require("./geminiAI.js");
const prompt_js_1 = require("./prompt.js");
const generative_ai_1 = require("@google/generative-ai");
async function BUMDExtractor(file) {
    // console.log(docPerda);
    let BUMDDescriptionJSON = null;
    const descSchema = {
        type: generative_ai_1.SchemaType.OBJECT,
        properties: {
            isPerdaBUMD: {
                type: generative_ai_1.SchemaType.BOOLEAN,
            },
            name: {
                type: generative_ai_1.SchemaType.STRING,
            },
            perda: {
                type: generative_ai_1.SchemaType.STRING,
            },
            pasal_terkait_tujuan: {
                type: generative_ai_1.SchemaType.ARRAY,
                items: {
                    type: generative_ai_1.SchemaType.OBJECT,
                    properties: {
                        pasal: {
                            type: generative_ai_1.SchemaType.STRING,
                        },
                        alasan: {
                            type: generative_ai_1.SchemaType.STRING,
                        },
                    },
                    required: ["pasal", "alasan"],
                },
            },
        },
        required: ["isPerdaBUMD", "name", "perda", "pasal_terkait_tujuan"],
    };
    try {
        console.time("get description json");
        BUMDDescriptionJSON = await (0, geminiAI_js_1.processGeminiWithFile)((0, prompt_js_1.getBUMDExtractorPrompt)(), file, true, descSchema);
        console.timeEnd("get description json");
    }
    catch (error) {
        console.log(error);
        throw error;
    }
    return BUMDDescriptionJSON;
}
exports.BUMDExtractor = BUMDExtractor;
async function asetExtractor(file) {
    // console.log(docPerda);
    let BUMDDescriptionJSON = null;
    const descSchema = {
        type: generative_ai_1.SchemaType.OBJECT,
        properties: {
            nomor_perda: {
                type: generative_ai_1.SchemaType.STRING,
            },
            judul_perda: {
                type: generative_ai_1.SchemaType.STRING,
            },
            bab: {
                type: generative_ai_1.SchemaType.ARRAY,
                items: {
                    type: generative_ai_1.SchemaType.OBJECT,
                    properties: {
                        nama_bab: {
                            type: generative_ai_1.SchemaType.STRING,
                        },
                        nomor_bab: {
                            type: generative_ai_1.SchemaType.STRING,
                        },
                        isi_pasal: {
                            type: generative_ai_1.SchemaType.STRING,
                        },
                    },
                    required: ["nama_bab", "nomor_bab", "isi_pasal"],
                },
            },
        },
        required: ["nomor_perda", "judul_perda", "bab"],
    };
    try {
        console.time("get description json");
        BUMDDescriptionJSON = await (0, geminiAI_js_1.processGeminiWithFile)((0, prompt_js_1.getAsetExtractorPrompt)(), file, true, descSchema);
        console.timeEnd("get description json");
    }
    catch (error) {
        console.log(error);
        throw error;
    }
    return BUMDDescriptionJSON;
}
exports.asetExtractor = asetExtractor;
//# sourceMappingURL=dms.js.map