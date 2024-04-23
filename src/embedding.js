import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey : 'sk-proj-0FXx2IW7Rg8jPxEq7OEJT3BlbkFJTqPnV2GkWnJzjgdhJBeM',
});

export async function embedding(input){
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: input,
    encoding_format: "float"
  });
  
  return embedding.data[0].embedding;
};