import { ObjectId } from "mongodb";
import { collectionAset } from "./mongodb_handler";
import { upsertToPineCone, matchVectorQuery, removeManyFromPinecone, removeOneFromPinecone } from "./pinecone";
import { evaluasiAset } from "./geminiAI";
import { embedding as embeddingOpenAI } from "./openAI";
import openaiTokenCounter from 'openai-gpt-token-counter';

function getOverChunk(chunk:any[], maxToken:number){
  const overChunk = chunk.filter(item => { 
    const countToken = openaiTokenCounter.text(item.desc, "gpt-4-32k");
    if(countToken >= maxToken){
      return item;
    };
  });

  return overChunk;
};

function splitTextToChunk(longText:string, maxToken:number){
  const splittedText = longText.split(' ');

  let fixedText = '';
  let textArray = [];

  for(let i = 0; i < splittedText.length; i++){
    fixedText += splittedText[i] + ' ';
    const countToken = openaiTokenCounter.text(fixedText, "gpt-4-32k");
    
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

export function splitChunks(chunksData:any[]){
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

  let finalChunks:any[] = [];

  chunkedArray.forEach(item => {
    item.forEach(object => {
      finalChunks.push(object);
    });
  });

  return finalChunks;
};

export async function uploadAsetChunksToMongo(chunksData:any, perdaName:any){
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
    chunksData.forEach((item:any) => {
      item.embedding = false;
      const countToken = openaiTokenCounter.text(item.desc, "gpt-4-32k");
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

export async function removePerdaChunks(perdaName:string){
  console.log('fungsi removePerdaChunks()');
  
  const checkPerda = await collectionAset.find({
    perda: { $eq: perdaName }
  }).toArray();
  // console.log(checkPerda);

  if(checkPerda.length !== 0){
    console.log(`remove all ${perdaName} chunks from mongo db and pinecone vdb`);
    
    // hapus semua perda chunks pada pinecone vdb
    const chunkIDs = checkPerda.map(item => {
      return item._id.toString();
    });
    // console.log(chunkID);
    await removeManyFromPinecone(chunkIDs,"aset");

    // hapus semua perda chunks pada mongo db
    await collectionAset.deleteMany({ perda: perdaName });
    
    console.log(`all ${perdaName} chunks were removed from mongo db and pinecone vdb`);
  } else {
    console.log(`${perdaName} is not exist...`);
  };
};

export async function getAllAsetChunks(){
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

  const asetList = await getAllAsetChunks();
  const asetNotEmbedded = asetList.filter(item => {
    return item.embedding !== true;
  });
  // console.log(asetNotEmbedded);

  return asetNotEmbedded;
};

async function processEmbeddingsFromAset(asetItem:any){
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
  await upsertToPineCone(arrayEmbeddings, "aset");

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

async function retrieveChunkFromMongo(chunksIDs:any[]){
  console.log('fungsi retrieveChunkFromMongo()');

  const idList = chunksIDs.map(item => { 
    return new ObjectId(String(item.id));
  });
  // console.log(idList);

  try {
    const result = await collectionAset.find({ _id: { $in: idList } }).toArray();
    return result;
  } catch (error) {
    throw error;
  };
};

export function mergeChunks(chunksPerda:any[]){
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

export async function getAsetCandidate(query:string, topK:number){
  console.log('fungsi getAsetCandidate()');
  // embeds query
  const embeddedQuery = await embeddingOpenAI(query); 
  // console.log(embeddedQuery);
  
  // cari similarity antara vector query dengan chunks pada pinecone vdb
  const matchingResultsID = await matchVectorQuery(embeddedQuery, topK, "aset");
  // console.log(matchingResultsID);

  // retrieve chunks dari mongo db berdasarkan id dari pinecone vdb
  const chunkList = await retrieveChunkFromMongo(matchingResultsID);
  // console.log(chunkList);
   
  // gabungkan setiap chunk berdasarkan dokumen/perda
  const sourcesList = mergeChunks(chunkList);
  // console.log(sourcesList);

  return sourcesList;
};

export async function getAsetCandidateNotMerged(query:string, topK:number){
  console.log('fungsi getAsetCandidateNotMerged()');
  // embeds query
  const embeddedQuery = await embeddingOpenAI(query); 
  // console.log(embeddedQuery);
  
  // cari similarity antara vector query dengan chunks pada pinecone vdb
  const matchingResultsID = await matchVectorQuery(embeddedQuery, topK, "aset");
  // console.log(matchingResultsID);

  // retrieve chunks dari mongo db berdasarkan id dari pinecone vdb
  const chunkList = await retrieveChunkFromMongo(matchingResultsID);
  // console.log(chunkList);
  
  // gabungkan setiap chunk berdasarkan dokumen/perda
  // const sourcesList = mergeChunks(chunkList);
  // console.log(sourcesList);

  return chunkList;
};

export async function processAsetQuery(query:string, model:string, topK:number){
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
    } catch (error) {
      console.log(error);
      return false;
    };
  };
};

export async function savePerdaAset(perdaAset:any){
  const perdaChunks:any[]=[]
  const loopBab=perdaAset.bab.forEach((bab:any)=>{
    const data = {
      _id: new ObjectId(),
      name: perdaAset.judul_perda,
      perda: perdaAset.nomor_perda,
      no_bab: bab.nomor_bab,
      nama_bab: bab.nama_bab,
      desc: bab.isi_pasal,
      embedding: true,
    };
    perdaChunks.push(data)
  })
  const perdaChunksEmbeddings = await Promise.all(perdaChunks.map(async (item:any) => {
    const vectorDesc = await embeddingOpenAI(item.desc);
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
  
  await collectionAset.insertMany(perdaChunks)
  await upsertToPineCone(perdaChunksEmbeddings, "aset");
  
};
export async function removeSelectedPerdaAset(perdas:any[]){
    await collectionAset.deleteMany({ perda: { $in: perdas } });
}

export async function removeSelectedAsetChunks(chunksIDs:any[]){
  console.log('fungsi removeSelectedAsetChunks()');
  console.log(chunksIDs);
  
  if(chunksIDs.length !== 0){
    // hapus chunks terpilih pada pinecone vdb
    await removeManyFromPinecone(chunksIDs,"aset");
    console.log('removes selected chunks from pinecone vdb...');

    // hapus chunks terpilih pada mongodb
    const chunksMongoID = chunksIDs.map(id => {
      return new ObjectId(String(id));
    });
    // console.log(chunksMongoID);

    await collectionAset.deleteMany({ _id: { $in: chunksMongoID } });
    console.log('removes selected chunks from mongodb...');

  } else {
    console.log('please select chunks...');
  };
};

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