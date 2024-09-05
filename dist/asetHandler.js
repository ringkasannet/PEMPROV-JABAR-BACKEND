"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSelectedAsetChunks = exports.removeSelectedPerdaAset = exports.savePerdaAset = exports.processAsetQuery = exports.getAsetCandidateNotMerged = exports.getAsetCandidate = exports.mergeChunks = exports.processAsetEmbeddings = exports.getAsetNotEmbedded = exports.getAllAsetChunks = exports.removePerdaChunks = exports.uploadAsetChunksToMongo = exports.splitChunks = void 0;
const mongodb_1 = require("mongodb");
const mongodb_handler_1 = require("./mongodb_handler");
const pinecone_1 = require("./pinecone");
const geminiAI_1 = require("./geminiAI");
const openAI_1 = require("./openAI");
const openai_gpt_token_counter_1 = __importDefault(require("openai-gpt-token-counter"));
function getOverChunk(chunk, maxToken) {
    const overChunk = chunk.filter(item => {
        const countToken = openai_gpt_token_counter_1.default.text(item.desc, "gpt-4-32k");
        if (countToken >= maxToken) {
            return item;
        }
        ;
    });
    return overChunk;
}
;
function splitTextToChunk(longText, maxToken) {
    const splittedText = longText.split(' ');
    let fixedText = '';
    let textArray = [];
    for (let i = 0; i < splittedText.length; i++) {
        fixedText += splittedText[i] + ' ';
        const countToken = openai_gpt_token_counter_1.default.text(fixedText, "gpt-4-32k");
        if (countToken >= maxToken) {
            const lastWord = fixedText.lastIndexOf(splittedText[i]);
            fixedText = fixedText.substring(0, lastWord);
            const lastSpace = fixedText.lastIndexOf(" ");
            fixedText = fixedText.substring(0, lastSpace);
            textArray.push(fixedText);
            fixedText = '';
            i--;
        }
        ;
    }
    ;
    textArray.push(fixedText);
    return textArray;
}
;
function splitChunks(chunksData) {
    console.log('fungsi splitChunks()');
    const maxToken = 8000;
    const overChunk = getOverChunk(chunksData, maxToken);
    const chunkedArray = overChunk.map(item => {
        const newDesc = splitTextToChunk(item.desc, maxToken);
        const newItem = newDesc.map(description => {
            return {
                name: item.name,
                perda: item.perda,
                no_bab: item.no_bab,
                nama_bab: item.nama_bab,
                desc: description,
            };
        });
        return newItem;
    });
    let finalChunks = [];
    chunkedArray.forEach(item => {
        item.forEach(object => {
            finalChunks.push(object);
        });
    });
    return finalChunks;
}
exports.splitChunks = splitChunks;
;
async function uploadAsetChunksToMongo(chunksData, perdaName) {
    console.log('fungsi uploadAsetChunksToMongo()');
    // periksa nama dokumen (perda) pada mongo db
    const checkPerda = await mongodb_handler_1.collectionAset.find({
        perda: { $eq: perdaName }
    }).toArray();
    // console.log(checkPerda);
    if (checkPerda.length !== 0) {
        console.log(perdaName, 'already exist...');
        return perdaName + ' chunks already exist...';
    }
    else {
        console.log(perdaName, 'is not exist...');
        // tambah property 'embedding = false' ke setiap chunks
        chunksData.forEach((item) => {
            item.embedding = false;
            const countToken = openai_gpt_token_counter_1.default.text(item.desc, "gpt-4-32k");
            console.log(`chunk token for '${item.perda} Bab ${item.no_bab}' is ${countToken}`);
        });
        // console.log(chunksData);
        // upload chunks ke mongo db
        console.log(`uploads ${perdaName} chunks to mongodb...`);
        await mongodb_handler_1.collectionAset.insertMany(chunksData);
        console.log(`uploads ${perdaName} is done...`);
        return chunksData;
    }
    ;
}
exports.uploadAsetChunksToMongo = uploadAsetChunksToMongo;
;
async function removePerdaChunks(perdaName) {
    console.log('fungsi removePerdaChunks()');
    const checkPerda = await mongodb_handler_1.collectionAset.find({
        perda: { $eq: perdaName }
    }).toArray();
    // console.log(checkPerda);
    if (checkPerda.length !== 0) {
        console.log(`remove all ${perdaName} chunks from mongo db and pinecone vdb`);
        // hapus semua perda chunks pada pinecone vdb
        const chunkIDs = checkPerda.map(item => {
            return item._id.toString();
        });
        // console.log(chunkID);
        await (0, pinecone_1.removeManyFromPinecone)(chunkIDs, "aset");
        // hapus semua perda chunks pada mongo db
        await mongodb_handler_1.collectionAset.deleteMany({ perda: perdaName });
        console.log(`all ${perdaName} chunks were removed from mongo db and pinecone vdb`);
    }
    else {
        console.log(`${perdaName} is not exist...`);
    }
    ;
}
exports.removePerdaChunks = removePerdaChunks;
;
async function getAllAsetChunks() {
    console.log('fungsi getAllAset()');
    try {
        const result = await mongodb_handler_1.collectionAset.find({}).toArray();
        return result;
    }
    catch (error) {
        throw error;
    }
    ;
}
exports.getAllAsetChunks = getAllAsetChunks;
;
async function getAsetNotEmbedded() {
    console.log('fungsi getAsetNotEmbedded()');
    const asetList = await getAllAsetChunks();
    const asetNotEmbedded = asetList.filter(item => {
        return item.embedding !== true;
    });
    // console.log(asetNotEmbedded);
    return asetNotEmbedded;
}
exports.getAsetNotEmbedded = getAsetNotEmbedded;
;
async function processEmbeddingsFromAset(asetItem) {
    console.log('fungsi processEmbeddingsFromAset()');
    console.log(asetItem.perda, 'chunks');
    const embedding = await (0, openAI_1.embedding)(asetItem.desc);
    // console.log(embedding);
    return {
        id: asetItem._id.toString(),
        values: embedding,
        metadata: {
            name: asetItem.name,
            perda: asetItem.perda,
            no_bab: asetItem.no_bab,
        },
    };
}
;
async function processAsetEmbeddings() {
    console.log('fungsi processAsetEmbeddings()');
    const asetList = await getAsetNotEmbedded();
    if (asetList.length === 0) {
        console.log('no Aset to process...');
        return [];
    }
    ;
    const arrayEmbeddingsPromises = await asetList.map(processEmbeddingsFromAset);
    const arrayEmbeddings = await Promise.all(arrayEmbeddingsPromises);
    // console.log(arrayEmbeddings);
    // upload hasil embedding ke pinecone vdb
    await (0, pinecone_1.upsertToPineCone)(arrayEmbeddings, "aset");
    const chunkID = arrayEmbeddings.map(item => {
        return new mongodb_1.ObjectId(String(item.id));
    });
    console.log('aset chunk(s) id:', chunkID);
    // update chunk property 'embedding' pada mongo db dari 'false' menjadi 'true'
    await mongodb_handler_1.collectionAset.updateMany({ _id: { $in: chunkID } }, { $set: { embedding: true } });
    return chunkID;
}
exports.processAsetEmbeddings = processAsetEmbeddings;
;
async function retrieveChunkFromMongo(chunksIDs) {
    console.log('fungsi retrieveChunkFromMongo()');
    const idList = chunksIDs.map(item => {
        return new mongodb_1.ObjectId(String(item.id));
    });
    // console.log(idList);
    try {
        const result = await mongodb_handler_1.collectionAset.find({ _id: { $in: idList } }).toArray();
        return result;
    }
    catch (error) {
        throw error;
    }
    ;
}
;
function mergeChunks(chunksPerda) {
    console.log('fungsi mergeChunks()');
    const perdaChunksList = chunksPerda.map(item => {
        return item.perda;
    });
    // console.log('perdaChunksList', perdaChunksList);
    const uniquePerdaList = [...new Set(perdaChunksList)];
    console.log('perda list:', uniquePerdaList);
    let perdaList = [];
    for (let i = 0; i < uniquePerdaList.length; i++) {
        perdaList.push({
            id: `perda${i + 1}`,
            perda: uniquePerdaList[i],
            name: '',
            desc: '',
        });
    }
    ;
    // chunksPerda.forEach(item => {
    //   item.desc = `hahaha ini adalah ${item.perda} Bab ${item.no_bab}`;
    // });
    perdaList.forEach(item => {
        chunksPerda.map(chunk => {
            if (chunk.perda === item.perda) {
                if (item.desc === '') {
                    item.name = chunk.name;
                    item.desc = chunk.perda + ' tentang ' + chunk.name + '\n';
                }
                ;
                item.desc += '\nBAB ' + chunk.no_bab + '\n' + chunk.nama_bab + '\n' + chunk.desc;
            }
            ;
        });
    });
    return perdaList;
}
exports.mergeChunks = mergeChunks;
;
async function getAsetCandidate(query, topK) {
    console.log('fungsi getAsetCandidate()');
    // embeds query
    const embeddedQuery = await (0, openAI_1.embedding)(query);
    // console.log(embeddedQuery);
    // cari similarity antara vector query dengan chunks pada pinecone vdb
    const matchingResultsID = await (0, pinecone_1.matchVectorQuery)(embeddedQuery, topK, "aset");
    // console.log(matchingResultsID);
    // retrieve chunks dari mongo db berdasarkan id dari pinecone vdb
    const chunkList = await retrieveChunkFromMongo(matchingResultsID);
    // console.log(chunkList);
    // gabungkan setiap chunk berdasarkan dokumen/perda
    const sourcesList = mergeChunks(chunkList);
    // console.log(sourcesList);
    return sourcesList;
}
exports.getAsetCandidate = getAsetCandidate;
;
async function getAsetCandidateNotMerged(query, topK) {
    console.log('fungsi getAsetCandidateNotMerged()');
    // embeds query
    const embeddedQuery = await (0, openAI_1.embedding)(query);
    // console.log(embeddedQuery);
    // cari similarity antara vector query dengan chunks pada pinecone vdb
    const matchingResultsID = await (0, pinecone_1.matchVectorQuery)(embeddedQuery, topK, "aset");
    // console.log(matchingResultsID);
    // retrieve chunks dari mongo db berdasarkan id dari pinecone vdb
    const chunkList = await retrieveChunkFromMongo(matchingResultsID);
    // console.log(chunkList);
    // gabungkan setiap chunk berdasarkan dokumen/perda
    // const sourcesList = mergeChunks(chunkList);
    // console.log(sourcesList);
    return chunkList;
}
exports.getAsetCandidateNotMerged = getAsetCandidateNotMerged;
;
async function processAsetQuery(query, model, topK) {
    console.log('fungsi processAsetQuery()');
    const sourcesList = await getAsetCandidate(query, topK);
    // console.log(sourcesList);
    let queryResults = null;
    if (model === 'OpenAi') {
        console.log('using Open-AI LLM model');
    }
    else {
        console.log('using Gemini-AI LLM model');
        try {
            queryResults = await (0, geminiAI_1.evaluasiAset)(query, sourcesList);
            return queryResults;
        }
        catch (error) {
            console.log(error);
            return false;
        }
        ;
    }
    ;
}
exports.processAsetQuery = processAsetQuery;
;
async function savePerdaAset(perdaAset) {
    const perdaChunks = [];
    const loopBab = perdaAset.bab.forEach((bab) => {
        const data = {
            _id: new mongodb_1.ObjectId(),
            name: perdaAset.judul_perda,
            perda: perdaAset.nomor_perda,
            no_bab: bab.nomor_bab,
            nama_bab: bab.nama_bab,
            desc: bab.isi_pasal,
            embedding: true,
        };
        perdaChunks.push(data);
    });
    const perdaChunksEmbeddings = await Promise.all(perdaChunks.map(async (item) => {
        const vectorDesc = await (0, openAI_1.embedding)(item.desc);
        return {
            id: item._id.toString(),
            values: vectorDesc,
            metadata: {
                name: item.name,
                perda: item.perda,
                no_bab: item.no_bab,
            },
        };
    }));
    await mongodb_handler_1.collectionAset.insertMany(perdaChunks);
    await (0, pinecone_1.upsertToPineCone)(perdaChunksEmbeddings, "aset");
}
exports.savePerdaAset = savePerdaAset;
;
async function removeSelectedPerdaAset(perdas) {
    await mongodb_handler_1.collectionAset.deleteMany({ perda: { $in: perdas } });
}
exports.removeSelectedPerdaAset = removeSelectedPerdaAset;
async function removeSelectedAsetChunks(chunksIDs) {
    console.log('fungsi removeSelectedAsetChunks()');
    console.log(chunksIDs);
    if (chunksIDs.length !== 0) {
        // hapus chunks terpilih pada pinecone vdb
        await (0, pinecone_1.removeManyFromPinecone)(chunksIDs, "aset");
        console.log('removes selected chunks from pinecone vdb...');
        // hapus chunks terpilih pada mongodb
        const chunksMongoID = chunksIDs.map(id => {
            return new mongodb_1.ObjectId(String(id));
        });
        // console.log(chunksMongoID);
        await mongodb_handler_1.collectionAset.deleteMany({ _id: { $in: chunksMongoID } });
        console.log('removes selected chunks from mongodb...');
    }
    else {
        console.log('please select chunks...');
    }
    ;
}
exports.removeSelectedAsetChunks = removeSelectedAsetChunks;
;
// function mergeDataAsetInput(rawData, maxToken){
//   console.log('fungsi mergeDataAsetInput()');
//   let finalChunk = [];
//   let chunkDesc = '';
//   let currentChunk = '';
//   for(let i = 0; i < rawData.length; i++) {
//     currentChunk += rawData[i].desc;
//     const descToken = openaiTokenCounter.text(currentChunk, "text-embedding-3-large");
//     console.log(descToken);
//     if(descToken >= maxToken){
//       finalChunk.push(chunkDesc);
//       currentChunk = '';
//       i--;
//     } else {
//       chunkDesc = currentChunk;
//     };
//   };
//   finalChunk.push(chunkDesc);
//   return finalChunk;
// };
// export async function inputDataAsetArray(jsonInput){
//   console.log('fungsi inputDataAsetArray()');
//   const nChunks = jsonInput.length;
//   // console.log(nChunks);
//   let tmpData = [];
//   for (let i = 0; i < nChunks; i++) {
//     // console.log(jsonInput[i].name);
//     const perda = `${jsonInput[i].jenis} ${jsonInput[i].nomor}/${jsonInput[i].tahun}`
//     // console.log(perda);
//     let desc = '';
//     if(jsonInput[i].no_bagian !== 'NULL'){
//       desc += '\nBagian ' + jsonInput[i].no_bagian + '\n' + jsonInput[i].nama_bagian + '\n';
//     };
//     if(jsonInput[i].no_paragraf !== 'NULL'){
//       desc += '\nParagraf ' + jsonInput[i].no_paragraf + '\n' + jsonInput[i].nama_paragraf + '\n'
//     };
//     desc += jsonInput[i].desc;
//     tmpData.push({
//       name: jsonInput[i].name,
//       perda: perda,
//       no_bab: jsonInput[i].no_bab,
//       nama_bab: jsonInput[i].nama_bab,
//       desc: desc,
//     });
//   };
//   console.log(tmpData);
//   let fixDataInput = [];
//   const maxToken = 8000;
//   tmpData.forEach(item => {
//     const descToken = openaiTokenCounter.text(item.desc, "text-embedding-3-large");
//     console.log(descToken);
//   });
//   const unchunkedData = tmpData.filter(item => {
//     const descToken = openaiTokenCounter.text(item.desc, "text-embedding-3-large");
//     // console.log('token', descToken);
//     return descToken >= maxToken;
//   });
//   if(unchunkedData.length !== 0){
//     console.log('unchunkedData:', unchunkedData.length);
//     for(let i = 0; i < unchunkedData.length; i++){
//       fixDataInput.push({
//         name: tmpData[0].name,
//         perda: tmpData[0].perda,
//         no_bab: tmpData[0].no_bab,
//         nama_bab: tmpData[0].nama_bab,
//         desc: unchunkedData[i].desc,
//       });
//     };
//   };
//   const chunkedData = tmpData.filter(item => {
//     const descToken = openaiTokenCounter.text(item.desc, "text-embedding-3-large");
//     // console.log('token', descToken);
//     return descToken < maxToken;
//   });
//   let chunkDataResult = [];
//   if(chunkedData.length !== 0){
//     console.log('chunkedData:', chunkedData.length);
//     chunkDataResult = mergeDataAsetInput(chunkedData, maxToken);
//   };
//   // console.log(chunkDataResult);
//   for(let i = 0; i < chunkDataResult.length; i++){
//     fixDataInput.push({
//       name: tmpData[0].name,
//       perda: tmpData[0].perda,
//       no_bab: tmpData[0].no_bab,
//       nama_bab: tmpData[0].nama_bab,
//       desc: chunkDataResult[i],
//     });
//   };
//   return fixDataInput;
// };
//# sourceMappingURL=asetHandler.js.map