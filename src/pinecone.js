import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: '6b96a466-044b-4593-804d-91d60ee89012'
});

const index = pc.index('pemprovjabar');

export async function updatevdb(vector){
  await index.upsert(vector);
}

export async function upsertManyToPineCone(vectors){
  console.log('updating to pinecone...',vectors)
  // const pineResult = await index.upsert([{
  //   "id": "1",
  //   "values": [0.1, 0.2, 0.3],
  // }]);
  const pineResult=await index.upsert(vectors);
  console.log('pineResult:',pineResult)
}

export async function matchvector(pertanyaan){
  const queryres = await index.query({
    topK: 10,
    vector: pertanyaan,
    includeValues: true,
    includeMetadata: true
  });

  return queryres;
};