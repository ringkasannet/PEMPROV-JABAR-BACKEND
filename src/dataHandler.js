import { collectionBUMD } from "./mongodb_handler.js";
import * as myembed from "./embedding.js"
import * as pc from './pinecone.js'

export async function getAllBUMD(){
  try {
    const results = await collectionBUMD.find({}).toArray(); //TODO: check error handling
    // console.log('got results:',results)
    return results;
  } catch(error){ 
    throw error; 
  };
};

export async function getBUMDNotEmbedded(){
  const BUMDList = await getAllBUMD()
  const BUMDNotEmbedded = BUMDList.filter(BUMDItem => {
    // console.log(BUMDItem);
    console.log("status embedding:", BUMDItem.embedding)
    return BUMDItem.embedding == false;
  });
  
  return BUMDNotEmbedded;
};

export async function getEmbedding(){
  const embedDoc = await getBUMDNotEmbedded();
  for await (const doc of embedDoc){
    // console.log(doc.desc);
    const embed = await myembed.embedding(doc.desc);
    doc.embeddedDesc = embed;
  };

  return embedDoc;
};

export async function updateVDB(){
  const data = await getEmbedding();
  for await (const doc of data){
    const vector = [
      {
        id: doc._id.toString(),
        values: doc.embeddedDesc,
        metadata: {
          name: doc.name,
          perda: doc.perda
        }
      }
    ];
    // console.log(vector);
    // update ke pinecone
    await pc.updatevdb(vector);
  };
};

export async function updateStatMongoDb(){
  const embedDoc = await getBUMDNotEmbedded();
  for await (const doc of embedDoc){
    console.log('update status mongo db')
    console.log(doc.name)
    const filter = { _id: doc._id };
    const update = { $set: { embedding: true }};
    // console.log(collectionBUMD)
    await collectionBUMD.updateOne(filter, update);
  };
};