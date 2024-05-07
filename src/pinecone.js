import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: '6b96a466-044b-4593-804d-91d60ee89012'
});

const index = pc.index('pemprovjabar');

export async function updatevdb(vector){
  await index.upsert(vector);
}

export async function upsertManyToPineCone(vectors){
  console.log('fungsi upsertManyToPineCone()');
  const pineResult = await index.upsert(vectors);
  console.log('pineResult:', pineResult);
};

// punten a masih pake loop jadul buat ngambil top 5 dari pinecone
export async function getTopFive(response){
  const topFive = [];
  for(let i = 0; i < 5; i++){
    topFive.push(response.matches[i].id);
  };
  
  return topFive;
};

export async function matchVectorQuery(query,n){
  console.log('fungsi matchVectorQuery()');
  const queryResponse = await index.query({
    topK: n,
    vector: query,
    includeValues: true
  });
  
  // const topFive = await getTopFive(queryresponse); //TODO remove
  return queryResponse.matches;
};