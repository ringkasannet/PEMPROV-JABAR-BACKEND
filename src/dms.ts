import { ObjectId } from "mongodb";
import { collectionBUMD } from "./mongodb_handler.js";
import { processGeminiWithFile } from "./geminiAI.js";
import { get } from "https";
import { getAsetExtractorPrompt, getBUMDExtractorPrompt } from "./prompt.js";
import { SchemaType } from "@google/generative-ai";
import { FileMetadataResponse } from "@google/generative-ai/dist/server/server.js";

export async function BUMDExtractor(file: FileMetadataResponse) {
    // console.log(docPerda);

    let BUMDDescriptionJSON = null;
    const descSchema = {
        type: SchemaType.OBJECT,
        properties: {
            isPerdaBUMD: {
                type: SchemaType.BOOLEAN,
            },
            name: {
                type: SchemaType.STRING,
            },
            perda: {
                type: SchemaType.STRING,
            },
            pasal_terkait_tujuan: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        pasal: {
                            type: SchemaType.STRING,
                        },
                        alasan: {
                            type: SchemaType.STRING,
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
        BUMDDescriptionJSON = await processGeminiWithFile(
            getBUMDExtractorPrompt(),
            file,
            true,
            descSchema,
        );
        console.timeEnd("get description json");
    } catch (error) {
        console.log(error);
        throw error;
    }
    return BUMDDescriptionJSON;
}

export async function asetExtractor(file: FileMetadataResponse) {
    // console.log(docPerda);

    let BUMDDescriptionJSON = null;
    const descSchema = {
        type: SchemaType.OBJECT,
        properties: {
            nomor_perda: {
                type: SchemaType.STRING,
            },
            judul_perda: {
                type: SchemaType.STRING,
            },
            bab: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        nama_bab: {
                            type: SchemaType.STRING,
                        },
                        nomor_bab: {
                            type: SchemaType.STRING,
                        },
                        isi_pasal: {
                            type: SchemaType.STRING,
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
        BUMDDescriptionJSON = await processGeminiWithFile(
            getAsetExtractorPrompt(),
            file,
            true,
            descSchema,
        );
        console.timeEnd("get description json");
    } catch (error) {
        console.log(error);
        throw error;
    }
    return BUMDDescriptionJSON;
}
