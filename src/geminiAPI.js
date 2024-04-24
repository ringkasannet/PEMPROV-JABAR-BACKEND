import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function queryPrompt(query, sources){
  // console.log(sources)

  const prompt = `
  Anda akan diberikan pertanyaan dan beberapa dokumen hukum.
  
  Pertanyaan: ${query}
  Sumber: ${sources}
  
  Anda hanya diizinkan untuk menjawab berdasarkan sumber yang telah diberikan.
  Jawablah pertanyaan yang berhubungan dengan sumber.
  
  Berikan similiarity score antara setiap dokumen dengan pertanyaan.
  Berikan jawaban berupa rangkuman berdasarkan setiap dokumen.
  Berikan semua pasal yang mendukung jawaban.
  
  Cantumkan semua dokumen yang diberikan meskipun tidak berhubungan dengan pertanyaan.
  Urutkan respon jawaban berdasarkan similiarity score dari tertinggi hingga terendah.
  
  Berikan respon jawaban dengan format yang sama persis dengan format berikut:
  '''
  - Judul dokumen: Judul dokumen
  - Skor: Similiarity Score dalam persen (%)
  - Jawaban: Hasil rangkuman singkat
  - Pasal: Pasal ..., Pasal ..., ...
  '''

  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  console.log('Jawaban:\n', response.text());
  return response.text();
};