import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey : process.env.OPENAI_API_KEY
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