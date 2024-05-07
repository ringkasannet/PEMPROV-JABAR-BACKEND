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

  await pc.upsertManyToPinecone(arrayEmbeddings);
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
  console.log('fungsi getMatchesDocsAndPinecone()');
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

async function matchQueryToPinecone(queryValue){
  console.log('fungsi matchQueryToPinecone()');
  const embeddedQuery = await embeddingQuery(queryValue);
  const matchingResults = await pc.matchVectorQuery(embeddedQuery);
  const bumdList = await getMatchesDocsAndPinecone(matchingResults);
  return bumdList;
};

async function getQueryResults(queryValue, sources){
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

export async function processQuery(queryValue){
  console.log('fungsi processQuery()');
  console.log('query:', queryValue);
  // asli
  // const matchingResults = await matchQueryToPinecone(queryValue);
  // dummy
  const matchingResults = await getSampleBUMD();
  
  const sourcesList = matchingResults.map((document) => {
    return { 
      id: document._id.toString(),
      name: document.name,
      desc: document.desc,
      perda: document.perda
    };
  });

  const queryResult = await getQueryResults(queryValue, sourcesList);
  return queryResult;
};

export async function removePropertyMongoDb(propertyName){
  collectionBUMD.updateMany({}, { $unset: { propertyName: '' } });
};

export async function addPropertyMongoDb(propertyName, propertyValue){
  collectionBUMD.updateMany({}, { $set: { propertyName: propertyValue } });
};