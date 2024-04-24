import { collectionBUMD } from "./mongodb_handler.js";
import * as embeddingOpenAI from "./openAIAPI.js";
import * as embeddingGemini from "./geminiAPI.js";
import * as pc from "./pinecone.js";
import { ObjectId } from "mongodb";



export async function getAllBUMD() {
  try {
    console.log('in getAllBUMD'); 
    const results = await collectionBUMD.find({}).toArray(); //TODO: check error handling
    return results;
  } catch (error) {
    throw error;
  }
}
 
export async function getBUMDNotEmbedded() {
  const BUMDList = await getAllBUMD();
  const BUMDNotEmbedded = BUMDList.filter((BUMDItem) => {
    return BUMDItem.embedding !== true;
  });

  return BUMDNotEmbedded;  
}

export async function getSampleBUMD() {
  const idObject1 = new ObjectId("662650b65f0d70008a1ac6e2");
  const idObject2 = new ObjectId("66265ade5b5554f1e30199b4");


  const sampleBUMD1 = await collectionBUMD.find({ _id: idObject1 }).toArray();
  const sampleBUMD2 = await collectionBUMD.find({ _id: idObject2 }).toArray();
  return [sampleBUMD1[0], sampleBUMD2[0]];
}

async function processEmbeddingsFromBUMD(BUMDItem) {
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

//tes driven development

export async function processEmbeddings() {
  console.log("start process embedding");
  const listBUMD = await getBUMDNotEmbedded();
  if (listBUMD.length === 0) {
    console.log('no BUMD to process')
    return [];
  }

  const arrayEmbeddingsPromises = await listBUMD.map(processEmbeddingsFromBUMD);

  const arrayEmbeddings = await Promise.all(arrayEmbeddingsPromises);

  console.log("embeddings result:", arrayEmbeddings);
  await pc.upsertManyToPineCone(arrayEmbeddings);
  const docId = arrayEmbeddings.map((embedding) => {
    const id = new ObjectId(embedding.id);
    return id;
  });
  console.log("docId:", docId);

  await collectionBUMD.updateMany({ _id: { $in: docId } }, { $set: { embedding: true } });
  return arrayEmbeddings.map((embedding) => {return embedding.id});
};

export async function embeddingQuery(queryValue){
  console.log('process embedding query')
  const embeddingQuery = await embeddingOpenAI.embedding(queryValue);
  return embeddingQuery;
};

export async function getMatchesDocumentsAndPinecone(topFiveIds){
  // console.log('lima id terbaik menurut pinecone:', topFiveIds)
  const docId = topFiveIds.map((idth) => {
    const id = new ObjectId(idth);
    return id;
  });

  try {
    const results = await collectionBUMD.find({_id: {$in: docId}}).toArray();
    return results;
  } catch (error) {
    throw error;
  };
};

export async function matchQueryToPinecone(queryValue){
  const embeddedQuery = await embeddingQuery(queryValue);
  const matchingResults = await pc.matchVectorQuery(embeddedQuery);
  const bumdList = await getMatchesDocumentsAndPinecone(matchingResults);
  return bumdList;
};

// terkadang ada masalah koneksi dengan pinecone:

// ERROR:
// PineconeConnectionError: Request failed to reach Pinecone. This can occur
// for reasons such as network problems that prevent the request from being
// completed, or a Pinecone API outage. Check your network connection, and
// visit https://status.pinecone.io/ to see whether any outages are ongoing.

// hipotesis: ditakutkan proses embed query terlalu lama sehingga pas matching 
// query ke pinecone, querynya ga kebawa
// mungkin program saya (await, promise, atau loop array) belum optimal

export async function processQuery(queryValue){
  console.log('query process:', queryValue);
  const matchingResults = await matchQueryToPinecone(queryValue);

  // disini saya nyoba untuk ngasih gemini dengan input sebagai berikut:
  // [
  //   {
  //     id: '123asc...asd',
  //     desc: 'PT xxx ...'
  //   },
  //   ...,
  //   {
  //     id: '3124d...asd',
  //     desc: 'PT yyy ...'
  //   },
  // ]
  // tapi gemini ga sanggup baca isinya sehingga saya bikin source yang isinya
  // cuma text array aja

  // const idsList = matchingResults.map((document) => { return document._id.toString() })
  const sourcesList = matchingResults.map((document) => { return document.desc })
  // const sourcesList = matchingResults.map((document) => {
  //   return {id: document._id.toString(), desc: document.desc}
  // })
  
  const queryProcess = await embeddingGemini.queryPrompt(queryValue, sourcesList);
  return queryProcess;
}

export async function removePropertyMongoDb(propertyName) {
  collectionBUMD.updateMany({}, { $unset: { propertyName: "" } });
}

export async function addPropertyMongoDb(propertyName, propertyValue) {
  collectionBUMD.updateMany({}, { $set: { propertyName: propertyValue } });
}
