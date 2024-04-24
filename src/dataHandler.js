import { collectionBUMD } from "./mongodb_handler.js";
import * as myembed from "./embedding.js";
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
  const embedding = await myembed.embedding(BUMDItem.desc);
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
}


export async function removePropertyMongoDb(propertyName) {
  collectionBUMD.updateMany({}, { $unset: { propertyName: "" } });
}

export async function addPropertyMongoDb(propertyName, propertyValue) {
  collectionBUMD.updateMany({}, { $set: { propertyName: propertyValue } });
}
