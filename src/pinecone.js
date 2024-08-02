import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: '6b96a466-044b-4593-804d-91d60ee89012'
});
const index = pc.index('pemprovjabar');
const indexAset = pc.index('pemanfaatan-aset');

// const pcAset = new Pinecone({
//   apiKey: '5a0aa56c-d5c6-4e21-8b28-0bb9d68174c7'
// });
// const index = pcAset.index('bumd');
// const indexAset = pcAset.index('aset');

export async function upsertManyToPineCone(vectors){
  console.log('fungsi upsertManyToPineCone()');
  await index.upsert(vectors);
};

export async function removeBUMDFromPinecone(chunkID){
  console.log('fungsi removeBUMDFromPinecone()');
  await index.deleteMany(chunkID);
};

export async function matchVectorQuery(query, n){
  console.log('fungsi matchVectorQuery()');
  const queryResponse = await index.query({
    topK: n,
    vector: query,
    includeValues: true
  });
  
  return queryResponse.matches;
};

export async function upsertAsetToPineCone(vectors){
  console.log('fungsi upsertAsetToPineCone()');
  await indexAset.upsert(vectors);
};

export async function matchVectorAsetQuery(query, n){
  console.log('fungsi matchVectorQuery()');
  
  const queryResponse = await indexAset.query({
    topK: n,
    vector: query,
    includeMetadata: true,
  });

  const queryResponseID = queryResponse.matches.map(item => {
    // console.log(item.metadata.perda, 'Bab', item.metadata.no_bab);
    return item.id;
  });
  
  return queryResponseID;
};

export async function removeAsetChunksFromPinecone(chunkID){
  await indexAset.deleteMany(chunkID);
};