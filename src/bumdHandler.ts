import { ObjectId } from 'mongodb';
import { collectionBUMD } from './mongodb_handler';
import * as pc from './pinecone';
import * as embeddingOpenAI from './openAI';
import * as embeddingGemini from './geminiAI';

export async function getAllBUMD(): Promise<BUMD[]>{
  try {
    console.log(`fungsi getAllBUMD()`);
    const result = (await collectionBUMD.find({}).toArray()) as BUMD[]; //TODO: check error handling
    return result;
  } catch (error){
    throw error;
  };
};

export type BUMD={
  id?: string;
  _id?: ObjectId;
  name: string;
  desc: string;
  perda: string;
  embedding: boolean;
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

export async function getBumdFromId(id:string){
  const idObject = new ObjectId(String(id));
  return  (await collectionBUMD.find({ _id: idObject }).toArray())as BUMD[];
};

async function processEmbeddingsFromBUMD(BUMDItem:BUMD){
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

  await pc.upsertToPineCone(arrayEmbeddings,"bumd");
  const docId = arrayEmbeddings.map(embedding => {
    const id = new ObjectId(embedding.id);
    return id;
  });
  console.log(`docId: ${docId}`);

  await collectionBUMD.updateMany({ _id: { $in: docId } }, { $set: { embedding: true } });
  return arrayEmbeddings.map((embedding) => { return embedding.id });
};

async function embeddingQuery(query:string){
  console.log('fungsi embeddingQuery()');
  const embeddingQuery = await embeddingOpenAI.embedding(query);
  return embeddingQuery;
};

async function getMatchesDocsAndPinecone(topFive:any){
  console.log('getting data from mongodb for top five');
  const docId = topFive.map((idth:any) => {
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

async function matchQueryToPinecone(query:string,num:number){ 
  console.log('fungsi matchQueryToPinecone()');
  const embeddedQuery = await embeddingQuery(query);
  const matchingResults = await pc.matchVectorQuery(embeddedQuery,num,"bumd");
  const bumdList = await getMatchesDocsAndPinecone(matchingResults);
  return bumdList;
};

async function getQueryResults(query:string, sources:[]){ //TODO dihapus
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
};

export async function processQuery(query:string,n:number,model:string){
  console.log('fungsi processQuery()');
  console.log('query:', query);

  const matchingResults = await matchQueryToPinecone(query,n);
  
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
  //   console.log('OpenAi model')
  // const queryResult = await embeddingOpenAI.penjelasanPrompt(queryValue, sourcesList);
  // //array of promise
  // console.log('queryResult:', queryResult);
  // return queryResult;
  } else {
    console.log('GeminiAi model')
    const queryResult = await embeddingGemini.penjelasanPrompt(query, sourcesList as BUMD[]);
    console.log('queryResult:', queryResult);
    return queryResult;
  }
};

export async function getBUMDCandidate(query:string,num=5){
  console.log('fungsi processQuery()');
  console.log('query:', query);
  // asli
  const matchingResults = await matchQueryToPinecone(query,num) ;
  
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
  return sourcesList as BUMD[];
};

export async function evaluasiBUMD(query:string,bumd:BUMD){
  console.log('fungsi evaluasiBUMD()');
  const streamResult = await embeddingOpenAI.evaluasiBUMDPrompt(query, bumd);
  return streamResult;
}

export async function removePropertyMongoDb(propertyName:string){
  collectionBUMD.updateMany({}, { $unset: { propertyName: '' } });
};

export async function addPropertyMongoDb(propertyName:string, propertyValue:any){
  collectionBUMD.updateMany({}, { $set: { propertyName: propertyValue } });
};

export async function savePerdaBUMD(perdaBUMD:any){
  let desc=""
  for (const pasal of perdaBUMD.pasal_terkait_tujuan){
    desc=desc+"\n "+pasal.pasal
  }
  const data = {
    _id: new ObjectId(),
    name: perdaBUMD.name,
    desc: desc,
    perda: perdaBUMD.perda,
    propertyName: 'true',
    embedding: true,
  };
  // console.log(data);
  
  // upload chunks ke mongo db
  console.log(`uploads ${data} to mongodb...`);
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
  console.log(`uploads ${data.perda} chunk vector to pinecone vdb...`);
  await pc.upsertToPineCone(embeddedData,"bumd");
};

export async function removeSelectedBUMDs(chunksID:string[]){
  console.log('fungsi removeSelectedBUMD()');
  console.log(chunksID);
  
  if(chunksID.length !== 0){
    // hapus chunks terpilih pada pinecone vdb
    await pc.removeManyFromPinecone(chunksID,"bumd");
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