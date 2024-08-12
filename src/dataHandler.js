import { ObjectId } from 'mongodb';
import { collectionBUMD } from './mongodb_handler.js';
import * as pc from './pinecone.js';
import * as embeddingOpenAI from './openAI.js';
import * as embeddingGemini from './geminiAI.js';

export async function getAllBUMD(){
  try {
    console.log(`fungsi getAllBUMD()`);
    const result = await collectionBUMD.find({}).toArray(); //TODO: check error handling
    
    return result;
  } catch (error){
    throw error;
  };
};

export async function getBUMDNotEmbedded(){
  console.log(`fungsi getBUMDNotEmbedded()`);
  const BUMDList = await getAllBUMD();
  const BUMDNotEmbedded = BUMDList.filter((BUMDItem) => {
    return BUMDItem.embedding !== true;
  });

  return BUMDNotEmbedded;
};

// untuk test
export async function getSampleBUMD(){
  console.log(`fungsi getSampleBUMD()`);
  const id1 = new ObjectId('662650b65f0d70008a1ac6e2');
  const id2 = new ObjectId('66265ade5b5554f1e30199b4');
  const id3 = new ObjectId('6626ad5f820c1b2afecf8c55');
  const id4 = new ObjectId('6626aee2820c1b2afecf8c5a');
  const id5 = new ObjectId('6626addd820c1b2afecf8c56');
  
  const sampleBUMD1 = await collectionBUMD.find({ _id: id1 }).toArray();
  const sampleBUMD2 = await collectionBUMD.find({ _id: id2 }).toArray();
  const sampleBUMD3 = await collectionBUMD.find({ _id: id3 }).toArray();
  const sampleBUMD4 = await collectionBUMD.find({ _id: id4 }).toArray();
  const sampleBUMD5 = await collectionBUMD.find({ _id: id5 }).toArray();

  return [sampleBUMD1[0], sampleBUMD2[0], sampleBUMD3[0], sampleBUMD4[0], sampleBUMD5[0]]
};

export async function getBumdFromId(id){
  const idObject = new ObjectId(String(id));
  return  await collectionBUMD.find({ _id: idObject }).toArray();
};

async function processEmbeddingsFromBUMD(BUMDItem){
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
};

export async function processEmbeddings(){
  console.log(`fungsi processEmbeddings()`);
  const listBUMD = await getBUMDNotEmbedded();
  
  if(listBUMD.length === 0){
    console.log('no BUMD to process');
    return [];
  };

  const arrayEmbeddingsPromises = await listBUMD.map(processEmbeddingsFromBUMD);
  const arrayEmbeddings = await Promise.all(arrayEmbeddingsPromises);
  console.log(`embeddings results: ${arrayEmbeddings}`);

  await pc.upsertManyToPineCone(arrayEmbeddings);
  const docId = arrayEmbeddings.map(embedding => {
    const id = new ObjectId(embedding.id);
    return id;
  });
  console.log(`docId: ${docId}`);

  await collectionBUMD.updateMany({ _id: { $in: docId } }, { $set: { embedding: true } });
  return arrayEmbeddings.map((embedding) => { return embedding.id });
};

async function embeddingQuery(queryValue){
  console.log('fungsi embeddingQuery()');
  const embeddingQuery = await embeddingOpenAI.embedding(queryValue);
  return embeddingQuery;
};

async function getMatchesDocsAndPinecone(topFive){
  console.log('getting data from mongodb for top five');
  const docId = topFive.map((idth) => {
    const id = new ObjectId(idth);
    return id;
  });

  try {
    const results = await collectionBUMD.find({ _id: {$in: docId} }).toArray();
    return results;
  } catch (error) {
    throw error;
  };
};

async function matchQueryToPinecone(queryValue,num){ 
  console.log('fungsi matchQueryToPinecone()');
  const embeddedQuery = await embeddingQuery(queryValue);
  const matchingResults = await pc.matchVectorQuery(embeddedQuery,num);
  const bumdList = await getMatchesDocsAndPinecone(matchingResults);
  return bumdList;
};

async function getQueryResults(queryValue, sources){ //TODO dihapus
  console.log('fungsi getQueryResults()');
  
  // TODO
  // let queryResult = null;
  // const analysisResult = await embeddingGemini.queryAnalysis(queryValue);
  // if(analysisResult.jenis === 'penjabaran'){
  //   queryResult = await embeddingGemini.penjabaranPrompt(queryValue, sources);
  // } else {
  //   queryResult = await embeddingGemini.penjelasanPrompt(queryValue, sources);
  // };

  const queryResult = await embeddingGemini.penjelasanPrompt(queryValue, sources);
  return queryResult;
};

export async function processQuery(queryValue,model){
  console.log('fungsi processQuery()');
  console.log('query:', queryValue);
  // asli
  const matchingResults = await matchQueryToPinecone(queryValue);
  
  // dummy
  // const matchingResults = await getSampleBUMD();
  console.log('matchingResults data:', matchingResults.map((document) => document.name));

  const sourcesList = matchingResults.map((document) => {
    return { 
      id: document._id.toString(), 
      name: document.name,
      desc: document.desc,
      perda: document.perda
    };
  });
  if (model === 'OpenAi'){
    console.log('OpenAi model')
  const queryResult = await embeddingOpenAI.penjelasanPrompt(queryValue, sourcesList);
  //array of promise
  console.log('queryResult:', queryResult);
  return queryResult;
  } else {
    console.log('GeminiAi model')
    const queryResult = await embeddingGemini.penjelasanPrompt(queryValue, sourcesList);
    console.log('queryResult:', queryResult);
    return queryResult;
  }
};

export async function getBUMDCandidate(queryValue,num=5){
  console.log('fungsi processQuery()');
  console.log('query:', queryValue);
  // asli
  const matchingResults = await matchQueryToPinecone(queryValue,num);
  
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
};

export async function evaluasiBUMD(query,bumd){
  console.log('fungsi evaluasiBUMD()');
  const streamResult = await embeddingOpenAI.evaluasiBUMDPrompt(query, bumd);
  return streamResult;
}

export async function removePropertyMongoDb(propertyName){
  collectionBUMD.updateMany({}, { $unset: { propertyName: '' } });
};

export async function addPropertyMongoDb(propertyName, propertyValue){
  collectionBUMD.updateMany({}, { $set: { propertyName: propertyValue } });
};

export async function inputDataBUMDObject(objInput){
  console.log('fungsi inputDataBUMDObject()');
  // console.log(objInput);

  let jenis = '';

  if (objInput.jenis === 'Peraturan Gubernur'){
    jenis = 'Pergub';
  } else if (objInput.jenis === 'Peraturan Daerah'){
    jenis = 'Perda';
  };

  const perda = `${jenis} ${objInput.nomor.toString()}/${objInput.tahun}`
  // console.log('nama perda:', perda);

  const desc = '## BUMD ' + objInput.name + '\n\n' +
    '## Dasar Hukum\n\n' +
    '** Tujuan Pendirian **:\n' + objInput.tujuan + '\n\n' +
    '** Ruang Lingkup Usaha **:\n' + objInput.ruang_lingkup;
  // console.log(desc);

  const data = {
    _id: new ObjectId(),
    name: objInput.name,
    desc: desc,
    perda: perda,
    propertyName: 'true',
    embedding: true,
  };
  // console.log(data);
  
  // upload chunks ke mongo db
  console.log(`uploads ${perda} to mongodb...`);
  await collectionBUMD.insertOne(data);

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
  console.log(`uploads ${perda} chunk vector to pinecone vdb...`);
  await pc.upsertManyToPineCone(embeddedData);
};

export async function removeSelectedBUMD(chunksID){
  console.log('fungsi removeSelectedBUMD()');
  // console.log(chunksID);
  
  if(chunksID.length !== 0){
    // hapus chunks terpilih pada pinecone vdb
    await pc.removeBUMDFromPinecone(chunksID);
    console.log('removes selected BUMD from pinecone vdb...');

    // hapus chunks terpilih pada mongodb
    const chunksMongoID = chunksID.map(id => {
      return new ObjectId(String(id));
    });
    // console.log(chunksMongoID);

    await collectionBUMD.deleteMany({ _id: { $in: chunksMongoID } });
    console.log('removes selected BUMD from mongodb...');

  } else {
    console.log('please select chunks...');
  };
};