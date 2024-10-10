import {
    Pinecone,
    PineconeRecord,
    type Index,
} from "@pinecone-database/pinecone";
import { embedding } from "./openAI.js";
import * as dotenv from "dotenv";

dotenv.config();

let pc: Pinecone, indexBUMD: Index, indexAset: Index;
console.log("Node mode:", process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
    // private account
    console.log("Using development pinecone");
    pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    indexBUMD = pc.index("bumd"); 
    indexAset = pc.index("asset");
} else if (process.env.NODE_ENV === "production") {
    // ringkasan net account
    console.log("Using private production pinecone");
    pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    indexBUMD = pc.index("bumd");
    indexAset = pc.index("asset");
}

const index = new Map<string, Index>();
index.set("aset", indexAset);
index.set("bumd", indexBUMD);

export async function upsertToPineCone(
    vectors: Array<PineconeRecord>,
    context: string,
) {
    console.log("fungsi upsertManyToPineCone() to ", context);
    index.get(context).upsert(vectors);
}


export async function matchVectorQuery(
    query: number[],
    n: number,
    context: string,
) {
    try {
        console.log("fungsi matchVectorQuery() from ", context);
        const queryResponse = await index.get(context).query({
            topK: n,
            vector: query,
            includeValues: true,
        });
        console.log("completed matchVectorQuery()");

        return queryResponse.matches;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function removeOneFromPinecone(chunkID: string, context: string) {
    console.log("fungsi removeChunksFromPinecone() from ", context);
    index.get(context).deleteOne(chunkID);
}

export async function removeManyFromPinecone(
    chunkIDs: string[],
    context: string,
) {
    console.log("fungsi removeFromPinecone() from ", context);
    index.get(context).deleteMany(chunkIDs);
}

export async function getAllVector(context: string) {
    if (!index.has(context)) {
        throw new Error("context not found");
    }
    const vectors = await index.get(context).listPaginated();
    return vectors;
}

export async function fetchAllVector(context: string, arrayId: string[]) {
    if (!index.has(context)) {
        throw new Error("context not found");
    }
    const vectors = await index.get(context).fetch(arrayId);
    return vectors;
}
