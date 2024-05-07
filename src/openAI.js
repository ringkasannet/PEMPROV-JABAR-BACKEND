import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey : 'sk-proj-8pAAtgxfPj5mvCNhOtfIT3BlbkFJUQ57dMNBzAxlcr9GetC3',
});

export async function embedding(input){
  console.log('fungsi embedding()');
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: input,
    encoding_format: "float"
  });
  
  return embedding.data[0].embedding;
};