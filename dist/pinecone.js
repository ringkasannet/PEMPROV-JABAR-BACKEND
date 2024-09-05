"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllVector = exports.removeManyFromPinecone = exports.removeOneFromPinecone = exports.matchVectorQuery = exports.upsertToPineCone = void 0;
const pinecone_1 = require("@pinecone-database/pinecone");
let pc, indexBUMD, indexAset;
console.log("Node mode:", process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
    // private account
    console.log("Using development pinecone");
    pc = new pinecone_1.Pinecone({
        apiKey: "5a0aa56c-d5c6-4e21-8b28-0bb9d68174c7",
    });
    indexBUMD = pc.index("bumd");
    indexAset = pc.index("aset");
}
else if (process.env.NODE_ENV === "production") {
    // ringkasan net account
    console.log("Using private production pinecone");
    pc = new pinecone_1.Pinecone({
        apiKey: "6b96a466-044b-4593-804d-91d60ee89012",
    });
    indexBUMD = pc.index("pemprovjabar");
    indexAset = pc.index("pemanfaatan-aset");
}
const index = new Map();
index.set("aset", indexAset);
index.set("bumd", indexBUMD);
async function upsertToPineCone(vectors, context) {
    console.log("fungsi upsertManyToPineCone() to ", context);
    index.get(context).upsert(vectors);
}
exports.upsertToPineCone = upsertToPineCone;
async function matchVectorQuery(query, n, context) {
    try {
        console.log("fungsi matchVectorQuery() from ", context);
        const queryResponse = await index.get(context).query({
            topK: n,
            vector: query,
            includeValues: true,
        });
        console.log("completed matchVectorQuery()");
        return queryResponse.matches;
    }
    catch (error) {
        console.log(error);
        throw error;
    }
}
exports.matchVectorQuery = matchVectorQuery;
async function removeOneFromPinecone(chunkID, context) {
    console.log("fungsi removeChunksFromPinecone() from ", context);
    index.get(context).deleteOne(chunkID);
}
exports.removeOneFromPinecone = removeOneFromPinecone;
async function removeManyFromPinecone(chunkIDs, context) {
    console.log("fungsi removeFromPinecone() from ", context);
    index.get(context).deleteMany(chunkIDs);
}
exports.removeManyFromPinecone = removeManyFromPinecone;
async function getAllVector(context) {
    if (!index.has(context)) {
        throw new Error("context not found");
    }
    const vectors = await index.get(context).listPaginated();
    return vectors;
}
exports.getAllVector = getAllVector;
//# sourceMappingURL=pinecone.js.map