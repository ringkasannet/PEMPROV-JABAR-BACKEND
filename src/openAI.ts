import OpenAI from "openai";
import * as dotenv from "dotenv";
import { createPrompt } from "./prompt";
import { BUMD } from "./bumdHandler";
// import 'dotenv/config';

dotenv.config();
console.log("dotenv.OPENAI_API_KEY: ", process.env.OPENAI_API_KEY);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function embedding(input:string) {
    console.log("fungsi embedding()");
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: input,
        encoding_format: "float",
    });

    return embedding.data[0].embedding;
}

export async function evaluasiBUMDPrompt(query: string, bumd: BUMD) {
    console.log("fungsi evaluasiBUMDPrompt() di OpenAI", query, bumd.name);

    const prompt = createPrompt(query, bumd);

    const stream = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content:
                    "anda adalah ahli hukum tata negara secara khusus dalam mengevaluasi kesesuaian penugasan BUMD dengan landasan hukum. Dalam memberikan jawaban anda selalu merujuk pada peraturan hukum yang berlaku dan analisis hukum yang mendalam",
            },
            { role: "user", content: prompt },
        ],

        model: "gpt-4-turbo-preview",
        stream: true,
    });

    return stream;
}
