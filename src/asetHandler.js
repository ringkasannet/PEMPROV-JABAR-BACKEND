import { ObjectId } from "mongodb";
import { collectionAset } from "./mongodb_handler.js";
import { upsertAsetToPineCone, matchVectorAsetQuery, removeAsetChunksFromPinecone } from "./pinecone.js";
import { evaluasiAset } from "./geminiAI.js";
import { embedding as embeddingOpenAI } from "./openAI.js";
import openaiTokenCounter from 'openai-gpt-token-counter';

function getOverChunk(chunk, maxToken){
  const overChunk = chunk.filter(item => { 
    const countToken = openaiTokenCounter.text(item.desc, "text-embedding-3-large");
    if(countToken >= maxToken){
      return item;
    };
  });

  return overChunk;
};

function splitTextToChunk(longText, maxToken){
  const splittedText = longText.split(' ');

  let fixedText = '';
  let textArray = [];

  for(let i = 0; i < splittedText.length; i++){
    fixedText += splittedText[i] + ' ';
    const countToken = openaiTokenCounter.text(fixedText, "text-embedding-3-large");
    
    if(countToken >= maxToken){
      const lastWord = fixedText.lastIndexOf(splittedText[i]);
      fixedText = fixedText.substring(0, lastWord);
      
      const lastSpace = fixedText.lastIndexOf(" ");
      fixedText = fixedText.substring(0, lastSpace);

      textArray.push(fixedText);

      fixedText = '';
      i--;
    };
  };

  textArray.push(fixedText);

  return textArray;
};

export function splitChunks(chunksData){
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
};

export async function uploadAsetChunksToMongo(chunksData, perdaName){
  console.log('fungsi uploadAsetChunksToMongo()');

  // periksa nama dokumen (perda) pada mongo db
  const checkPerda = await collectionAset.find({
    perda: { $eq: perdaName }
  }).toArray();
  // console.log(checkPerda);

  if(checkPerda.length !== 0){
    console.log(perdaName, 'already exist...');
    return perdaName + ' chunks already exist...';
  } else {
    console.log(perdaName, 'is not exist...');

    // tambah property 'embedding = false' ke setiap chunks
    chunksData.forEach(item => {
      item.embedding = false;
      const countToken = openaiTokenCounter.text(item.desc, "text-embedding-3-large");
      console.log(`chunk token for '${item.perda} Bab ${item.no_bab}' is ${countToken}`);
    });
    // console.log(chunksData);

    // upload chunks ke mongo db
    console.log(`uploads ${perdaName} chunks to mongodb...`);
    await collectionAset.insertMany(chunksData);
    console.log(`uploads ${perdaName} is done...`);
    
    return chunksData;
  };
};

export async function removePerdaChunks(perdaName){
  console.log('fungsi removePerdaChunks()');
  
  const checkPerda = await collectionAset.find({
    perda: { $eq: perdaName }
  }).toArray();
  // console.log(checkPerda);

  if(checkPerda.length !== 0){
    console.log(`remove all ${perdaName} chunks from mongo db and pinecone vdb`);
    
    // hapus semua perda chunks pada pinecone vdb
    const chunkID = checkPerda.map(item => {
      return item._id.toString();
    });
    // console.log(chunkID);
    await removeAsetChunksFromPinecone(chunkID);

    // hapus semua perda chunks pada mongo db
    await collectionAset.deleteMany({ perda: perdaName });
    
    console.log(`all ${perdaName} chunks were removed from mongo db and pinecone vdb`);
  } else {
    console.log(`${perdaName} is not exist...`);
  };
};

export async function getAllAset(){
  console.log('fungsi getAllAset()');
  try {
    const result = await collectionAset.find({}).toArray();
    return result;
  } catch (error) {
    throw error;
  };
};

export async function getAsetNotEmbedded(){
  console.log('fungsi getAsetNotEmbedded()');

  const asetList = await getAllAset();
  const asetNotEmbedded = asetList.filter(item => {
    return item.embedding !== true;
  });
  // console.log(asetNotEmbedded);

  return asetNotEmbedded;
};

async function processEmbeddingsFromAset(asetItem){
  console.log('fungsi processEmbeddingsFromAset()');
  console.log(asetItem.perda, 'chunks');

  const embedding = await embeddingOpenAI(asetItem.desc);
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
};

export async function processAsetEmbeddings(){
  console.log('fungsi processAsetEmbeddings()');
  
  const asetList = await getAsetNotEmbedded();
  
  if(asetList.length === 0){
    console.log('no Aset to process...');
    return [];
  };

  const arrayEmbeddingsPromises = await asetList.map(processEmbeddingsFromAset);
  const arrayEmbeddings = await Promise.all(arrayEmbeddingsPromises);
  // console.log(arrayEmbeddings);

  // upload hasil embedding ke pinecone vdb
  await upsertAsetToPineCone(arrayEmbeddings);

  const chunkID = arrayEmbeddings.map(item => {
    return new ObjectId(String(item.id));
  });
  console.log('aset chunk(s) id:', chunkID);

  // update chunk property 'embedding' pada mongo db dari 'false' menjadi 'true'
  await collectionAset.updateMany(
    { _id: { $in: chunkID } },
    { $set: { embedding: true } },
  );
  
  return chunkID;
};

async function retrieveChunkFromMongo(chunksID){
  console.log('fungsi retrieveChunkFromMongo()');

  const idList = chunksID.map(item => {
    return new ObjectId(String(item));
  });
  // console.log(idList);

  try {
    const result = await collectionAset.find({ _id: { $in: idList } }).toArray();
    return result;
  } catch (error) {
    throw error;
  };
};

function mergeChunks(chunksPerda){
  console.log('fungsi mergeChunks()');

  const perdaChunksList = chunksPerda.map(item => {
    return item.perda;
  });
  // console.log('perdaChunksList', perdaChunksList);

  const uniquePerdaList = [...new Set(perdaChunksList)];
  console.log('perda list:', uniquePerdaList);

  let perdaList = [];
  for(let i = 0; i < uniquePerdaList.length; i++){
    perdaList.push({
      id: `perda${i + 1}`,
      perda: uniquePerdaList[i],
      name: '',
      desc: '',
    });
  };

  // chunksPerda.forEach(item => {
  //   item.desc = `hahaha ini adalah ${item.perda} Bab ${item.no_bab}`;
  // });

  perdaList.forEach(item => {
    chunksPerda.map(chunk => {
      if(chunk.perda === item.perda){
        if(item.desc === ''){
          item.name = chunk.name;
          item.desc = chunk.perda + ' tentang ' + chunk.name + '\n';
        };

        item.desc += '\nBAB ' + chunk.no_bab + '\n' + chunk.nama_bab + '\n' + chunk.desc;
      };
    });
  });

  return perdaList;
};

export async function getAsetCandidate(query, topK){
  console.log('fungsi getAsetCandidate()');
  // embeds query
  const embeddedQuery = await embeddingOpenAI(query); 
  // console.log(embeddedQuery);
  
  // cari similarity antara vector query dengan chunks pada pinecone vdb
  const matchingResultsID = await matchVectorAsetQuery(embeddedQuery, topK);
  // console.log(matchingResultsID);

  // retrieve chunks dari mongo db berdasarkan id dari pinecone vdb
  const chunkList = await retrieveChunkFromMongo(matchingResultsID);
  // console.log(chunkList);
  
  // gabungkan setiap chunk berdasarkan dokumen/perda
  const sourcesList = mergeChunks(chunkList);
  // console.log(sourcesList);

  return sourcesList;
};


export async function getAsetCandidateNotMerged(query, topK){
  console.log('fungsi getAsetCandidate()');
  // embeds query
  const embeddedQuery = await embeddingOpenAI(query); 
  // console.log(embeddedQuery);
  
  // cari similarity antara vector query dengan chunks pada pinecone vdb
  const matchingResultsID = await matchVectorAsetQuery(embeddedQuery, topK);
  // console.log(matchingResultsID);

  // retrieve chunks dari mongo db berdasarkan id dari pinecone vdb
  const chunkList = await retrieveChunkFromMongo(matchingResultsID);
  // console.log(chunkList);
  
  // gabungkan setiap chunk berdasarkan dokumen/perda
  // const sourcesList = mergeChunks(chunkList);
  // console.log(sourcesList);

  return chunkList;
};

export async function processAsetQuery(query, model, topK){
  console.log('fungsi processAsetQuery()');

  const sourcesList = await getAsetCandidate(query, topK);
  // console.log(sourcesList);

  let queryResults = null;

  if(model === 'OpenAi'){
    console.log('using Open-AI LLM model');
  } else {
    console.log('using Gemini-AI LLM model');
    try {
      queryResults = await evaluasiAset(query, sourcesList);
      return queryResults;
    } catch (error){
      console.log(error);
      return false;
    };
  };
};

export async function inputDataAsetObject(objInput){
  console.log('fungsi inputDataAsetObject()');
  
  let jenis = '';

  if (objInput.jenis === 'Peraturan Gubernur'){
    jenis = 'Pergub';
  } else if (objInput.jenis === 'Peraturan Daerah'){
    jenis = 'Perda';
  };

  const perda = `${jenis} ${objInput.nomor.toString()}/${objInput.tahun}`
  // console.log('nama perda:', perda);

  let desc = '';
  
  if(objInput.no_bagian !== ''){
    desc += 'Bagian ' + objInput.no_bagian.toString() + '\n' + objInput.nama_bagian + '\n\n';
  };

  if(objInput.no_paragraf !== ''){
    desc += 'Paragraf ' + objInput.no_paragraf + '\n' + objInput.nama_paragraf + '\n\n';
  };
  
  desc += objInput.desc;

  const data = {
    _id: new ObjectId(),
    name: objInput.nama,
    perda: perda,
    no_bab: objInput.no_bab.toString(),
    nama_bab: objInput.nama_bab,
    desc: desc,
  };
  // console.log(data);
  
  // upload chunks ke mongo db
  console.log(`uploads ${perda} chunk to mongodb...`);
  await collectionAset.insertOne(data);

  // embed desc
  const vectorDesc = await embeddingOpenAI(data.desc);
  // console.log(vectorDesc);

  const embeddedData = [
    {
      id: data._id.toString(),
      values: vectorDesc,
      metadata: {
        name: data.name,
        perda: data.perda,
        no_bab: data.no_bab,
      },
    },
  ];
  // console.log(embeddedData);

  // upload chunks ke pinecone vdb
  console.log(`uploads ${perda} chunk vector to pinecone vdb...`);
  await upsertAsetToPineCone(embeddedData);
};

export async function removeSelectedAsetChunks(chunksID){
  console.log('fungsi removeSelectedAsetChunks()');
  // console.log(chunksID);
  
  if(chunksID.length !== 0){
    // hapus chunks terpilih pada pinecone vdb
    await removeAsetChunksFromPinecone(chunksID);
    console.log('removes selected chunks from pinecone vdb...');

    // hapus chunks terpilih pada mongodb
    const chunksMongoID = chunksID.map(id => {
      return new ObjectId(String(id));
    });
    // console.log(chunksMongoID);

    await collectionAset.deleteMany({ _id: { $in: chunksMongoID } });
    console.log('removes selected chunks from mongodb...');

  } else {
    console.log('please select chunks...');
  };
};