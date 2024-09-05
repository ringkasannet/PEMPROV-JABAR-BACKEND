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
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSelectedBUMDs = exports.savePerdaBUMD = exports.addPropertyMongoDb = exports.removePropertyMongoDb = exports.evaluasiBUMD = exports.getBUMDCandidate = exports.processQuery = exports.processEmbeddings = exports.getBumdFromId = exports.getSampleBUMD = exports.getBUMDNotEmbedded = exports.getAllBUMD = void 0;
const mongodb_1 = require("mongodb");
const mongodb_handler_1 = require("./mongodb_handler");
const pc = __importStar(require("./pinecone"));
const embeddingOpenAI = __importStar(require("./openAI"));
const embeddingGemini = __importStar(require("./geminiAI"));
async function getAllBUMD() {
    try {
        console.log(`fungsi getAllBUMD()`);
        const result = (await mongodb_handler_1.collectionBUMD.find({}).toArray()); //TODO: check error handling
        return result;
    }
    catch (error) {
        throw error;
    }
    ;
}
exports.getAllBUMD = getAllBUMD;
;
async function getBUMDNotEmbedded() {
    console.log(`fungsi getBUMDNotEmbedded()`);
    const BUMDList = await getAllBUMD();
    const BUMDNotEmbedded = BUMDList.filter((BUMDItem) => {
        return BUMDItem.embedding !== true;
    });
    return BUMDNotEmbedded;
}
exports.getBUMDNotEmbedded = getBUMDNotEmbedded;
;
// untuk test
async function getSampleBUMD() {
    console.log(`fungsi getSampleBUMD()`);
    const id1 = new mongodb_1.ObjectId('662650b65f0d70008a1ac6e2');
    const id2 = new mongodb_1.ObjectId('66265ade5b5554f1e30199b4');
    const id3 = new mongodb_1.ObjectId('6626ad5f820c1b2afecf8c55');
    const id4 = new mongodb_1.ObjectId('6626aee2820c1b2afecf8c5a');
    const id5 = new mongodb_1.ObjectId('6626addd820c1b2afecf8c56');
    const sampleBUMD1 = await mongodb_handler_1.collectionBUMD.find({ _id: id1 }).toArray();
    const sampleBUMD2 = await mongodb_handler_1.collectionBUMD.find({ _id: id2 }).toArray();
    const sampleBUMD3 = await mongodb_handler_1.collectionBUMD.find({ _id: id3 }).toArray();
    const sampleBUMD4 = await mongodb_handler_1.collectionBUMD.find({ _id: id4 }).toArray();
    const sampleBUMD5 = await mongodb_handler_1.collectionBUMD.find({ _id: id5 }).toArray();
    return [sampleBUMD1[0], sampleBUMD2[0], sampleBUMD3[0], sampleBUMD4[0], sampleBUMD5[0]];
}
exports.getSampleBUMD = getSampleBUMD;
;
async function getBumdFromId(id) {
    const idObject = new mongodb_1.ObjectId(String(id));
    return (await mongodb_handler_1.collectionBUMD.find({ _id: idObject }).toArray());
}
exports.getBumdFromId = getBumdFromId;
;
async function processEmbeddingsFromBUMD(BUMDItem) {
    console.log(`fungsi processEmbeddingsFromBUMD()`);
    const embedding = await embeddingOpenAI.embedding(BUMDItem.desc);
    return {
        id: BUMDItem._id.toString(),
        values: embedding,
        metadata: {
            name: BUMDItem.name,
            perda: BUMDItem.perda,
        },
    };
}
;
async function processEmbeddings() {
    console.log(`fungsi processEmbeddings()`);
    const listBUMD = await getBUMDNotEmbedded();
    if (listBUMD.length === 0) {
        console.log('no BUMD to process');
        return [];
    }
    ;
    const arrayEmbeddingsPromises = await listBUMD.map(processEmbeddingsFromBUMD);
    const arrayEmbeddings = await Promise.all(arrayEmbeddingsPromises);
    console.log(`embeddings results: ${arrayEmbeddings}`);
    await pc.upsertToPineCone(arrayEmbeddings, "bumd");
    const docId = arrayEmbeddings.map(embedding => {
        const id = new mongodb_1.ObjectId(embedding.id);
        return id;
    });
    console.log(`docId: ${docId}`);
    await mongodb_handler_1.collectionBUMD.updateMany({ _id: { $in: docId } }, { $set: { embedding: true } });
    return arrayEmbeddings.map((embedding) => { return embedding.id; });
}
exports.processEmbeddings = processEmbeddings;
;
async function embeddingQuery(query) {
    console.log('fungsi embeddingQuery()');
    const embeddingQuery = await embeddingOpenAI.embedding(query);
    return embeddingQuery;
}
;
async function getMatchesDocsAndPinecone(topFive) {
    console.log('getting data from mongodb for top five');
    const docId = topFive.map((idth) => {
        const id = new mongodb_1.ObjectId(idth);
        return id;
    });
    try {
        const results = await mongodb_handler_1.collectionBUMD.find({ _id: { $in: docId } }).toArray();
        return results;
    }
    catch (error) {
        throw error;
    }
    ;
}
;
async function matchQueryToPinecone(query, num) {
    console.log('fungsi matchQueryToPinecone()');
    const embeddedQuery = await embeddingQuery(query);
    const matchingResults = await pc.matchVectorQuery(embeddedQuery, num, "bumd");
    const bumdList = await getMatchesDocsAndPinecone(matchingResults);
    return bumdList;
}
;
async function getQueryResults(query, sources) {
    console.log('fungsi getQueryResults()');
    // TODO
    // let queryResult = null;
    // const analysisResult = await embeddingGemini.queryAnalysis(queryValue);
    // if(analysisResult.jenis === 'penjabaran'){
    //   queryResult = await embeddingGemini.penjabaranPrompt(queryValue, sources);
    // } else {
    //   queryResult = await embeddingGemini.penjelasanPrompt(queryValue, sources);
    // };
    const queryResult = await embeddingGemini.penjelasanPrompt(query, sources);
    return queryResult;
}
;
async function processQuery(query, n, model) {
    console.log('fungsi processQuery()');
    console.log('query:', query);
    const matchingResults = await matchQueryToPinecone(query, n);
    console.log('matchingResults data:', matchingResults.map((document) => document.name));
    const sourcesList = matchingResults.map((document) => {
        return {
            id: document._id.toString(),
            name: document.name,
            desc: document.desc,
            perda: document.perda
        };
    });
    if (model === 'OpenAi') {
        //   console.log('OpenAi model')
        // const queryResult = await embeddingOpenAI.penjelasanPrompt(queryValue, sourcesList);
        // //array of promise
        // console.log('queryResult:', queryResult);
        // return queryResult;
    }
    else {
        console.log('GeminiAi model');
        const queryResult = await embeddingGemini.penjelasanPrompt(query, sourcesList);
        console.log('queryResult:', queryResult);
        return queryResult;
    }
}
exports.processQuery = processQuery;
;
async function getBUMDCandidate(query, num = 5) {
    console.log('fungsi processQuery()');
    console.log('query:', query);
    // asli
    const matchingResults = await matchQueryToPinecone(query, num);
    // dummy
    // const matchingResults = await getSampleBUMD();
    console.log('matchingResults:', matchingResults.map((document) => document.name));
    const sourcesList = matchingResults.map((document) => {
        return {
            id: document._id.toString(),
            name: document.name,
            desc: document.desc,
            perda: document.perda
        };
    });
    return sourcesList;
}
exports.getBUMDCandidate = getBUMDCandidate;
;
async function evaluasiBUMD(query, bumd) {
    console.log('fungsi evaluasiBUMD()');
    const streamResult = await embeddingOpenAI.evaluasiBUMDPrompt(query, bumd);
    return streamResult;
}
exports.evaluasiBUMD = evaluasiBUMD;
async function removePropertyMongoDb(propertyName) {
    mongodb_handler_1.collectionBUMD.updateMany({}, { $unset: { propertyName: '' } });
}
exports.removePropertyMongoDb = removePropertyMongoDb;
;
async function addPropertyMongoDb(propertyName, propertyValue) {
    mongodb_handler_1.collectionBUMD.updateMany({}, { $set: { propertyName: propertyValue } });
}
exports.addPropertyMongoDb = addPropertyMongoDb;
;
async function savePerdaBUMD(perdaBUMD) {
    let desc = "";
    for (const pasal of perdaBUMD.pasal_terkait_tujuan) {
        desc = desc + "\n " + pasal.pasal;
    }
    const data = {
        _id: new mongodb_1.ObjectId(),
        name: perdaBUMD.name,
        desc: desc,
        perda: perdaBUMD.perda,
        propertyName: 'true',
        embedding: true,
    };
    // console.log(data);
    // upload chunks ke mongo db
    console.log(`uploads ${data} to mongodb...`);
    await mongodb_handler_1.collectionBUMD.insertOne(data);
    // embed desc
    const vectorDesc = await embeddingOpenAI.embedding(data.desc);
    // console.log(vectorDesc);
    const embeddedData = [
        {
            id: data._id.toString(),
            values: vectorDesc,
            metadata: {
                name: data.name,
                perda: data.perda,
            },
        },
    ];
    // console.log(embeddedData);
    // upload chunks ke pinecone vdb
    console.log(`uploads ${data.perda} chunk vector to pinecone vdb...`);
    await pc.upsertToPineCone(embeddedData, "bumd");
}
exports.savePerdaBUMD = savePerdaBUMD;
;
async function removeSelectedBUMDs(chunksID) {
    console.log('fungsi removeSelectedBUMD()');
    console.log(chunksID);
    if (chunksID.length !== 0) {
        // hapus chunks terpilih pada pinecone vdb
        await pc.removeManyFromPinecone(chunksID, "bumd");
        console.log('removes selected BUMD from pinecone vdb...');
        // hapus chunks terpilih pada mongodb
        const chunksMongoID = chunksID.map(id => {
            return new mongodb_1.ObjectId(String(id));
        });
        // console.log(chunksMongoID);
        await mongodb_handler_1.collectionBUMD.deleteMany({ _id: { $in: chunksMongoID } });
        console.log('removes selected BUMD from mongodb...');
    }
    else {
        console.log('please select chunks...');
    }
    ;
}
exports.removeSelectedBUMDs = removeSelectedBUMDs;
;
//# sourceMappingURL=bumdHandler.js.map