"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluasiBUMDPrompt = exports.embedding = void 0;
const openai_1 = __importDefault(require("openai"));
const dotenv = __importStar(require("dotenv"));
const prompt_1 = require("./prompt");
// import 'dotenv/config';
dotenv.config();
console.log("dotenv.OPENAI_API_KEY: ", process.env.OPENAI_API_KEY);
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
async function embedding(input) {
    console.log("fungsi embedding()");
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: input,
        encoding_format: "float",
    });
    return embedding.data[0].embedding;
}
exports.embedding = embedding;
async function evaluasiBUMDPrompt(query, bumd) {
    console.log("fungsi evaluasiBUMDPrompt() di OpenAI", query, bumd.name);
    const prompt = (0, prompt_1.createPrompt)(query, bumd);
    const stream = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "anda adalah ahli hukum tata negara secara khusus dalam mengevaluasi kesesuaian penugasan BUMD dengan landasan hukum. Dalam memberikan jawaban anda selalu merujuk pada peraturan hukum yang berlaku dan analisis hukum yang mendalam",
            },
            { role: "user", content: prompt },
        ],
        model: "gpt-4-turbo-preview",
        stream: true,
    });
    return stream;
}
exports.evaluasiBUMDPrompt = evaluasiBUMDPrompt;
//# sourceMappingURL=openAI.js.map