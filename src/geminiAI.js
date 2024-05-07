import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function queryAnalysis(query){
  console.log('fungsi queryAnalysis()')

  const prompt = `
  Anda akan diberikan query.
  
  Query: ${query}
  
  Tugas anda ialah menganalisis jenis query yang diberikan.
  Apakah query merupakan penjelasan atau penjabaran.
  Jika query mengandung kata 'sebutkan' atau 'apa saja',
  maka query tersebut merupakan penjabaran meskipun terdapat kata 'menjelaskan'.
  
  Berikan respon jawaban dalam format JSON seperti contoh dibawah.
  
  {
    "jenis": "penjelasan"
  }

  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const jawaban = response.text();
  try {
    JSON.parse(jawaban);
    return await JSON.parse(jawaban);
  } catch (error){
    // console.log(error);
    console.log('queryAnalysis() return a non-valid JSON format!');
    return {
      jenis: "penjabaran"
    };
  };
};

export async function penjabaranPrompt(query, sources){
  console.log('fungsi penjabaranPrompt()');
  
  const promptsPerSource = Promise.all(sources.map(async (s) => {
    const prompt = `
    Anda akan diberikan pertanyaan dan beberapa dokumen hukum.
    
    Pertanyaan: ${query}
    ID Sumber: ${s.id}
    Sumber: ${s.desc}
    Nomor dokumen: ${s.perda}
    
    Anda hanya diizinkan untuk menjawab berdasarkan sumber yang telah diberikan.
    Jawablah pertanyaan yang berhubungan dengan sumber.
    
    ID sumber wajib dicantumkan dan ID sumber tidak boleh diubah sedikitpun.
    Nomor perda tidak boleh diubah sedikitpun.
    Berikan similiarity score menurut anda antara pertanyaan dengan sumber.
    Sebutkan semua nomor pasal yang mendukung jawaban.
    Sebutkan semua isi pasal berdasarkan nomor pasal secara lengkap tanpa merubah sedikitpun isi pasalnya.
    Nomor dan isi pasal wajib dicantumkan.
    
    Berikan respon jawaban dengan format seperti contoh dibawah.
    ** Skor **: similiarity score menurut anda dalam satuan persen (%)\n
    ** ID BUMD **: ${s.id}\n
    ** Nama BUMD **: ${s.name}\n
    ** Penjelasan **: Jawaban secara lengkap\n
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jawaban = response.text();

    return jawaban;
  }));

  return await promptsPerSource;
};

export async function penjelasanPrompt(query, sources){
  console.log('fungsi penjelasanPrompt()');
  
  const promptsPerSource = Promise.all(sources.map(async (s) => {
    const prompt = `
    Anda akan diberikan pertanyaan dan beberapa dokumen hukum.
    
    Pertanyaan: ${query}
    ID Sumber: ${s.id}
    Sumber: ${s.desc}
    
    Anda hanya diizinkan untuk menjawab berdasarkan sumber yang telah diberikan.
    Jawablah pertanyaan yang berhubungan dengan sumber.
    
    ID sumber wajib dicantumkan dan ID sumber tidak boleh diubah sedikitpun.
    Nomor perda tidak boleh diubah sedikitpun.
    Berikan similiarity score menurut anda antara pertanyaan dengan sumber.
    Berikan jawaban secara lengkap berdasarkan sumber.
    Berikan semua nomor pasal yang mendukung jawaban.
    Nomor pasal wajib dicantumkan.

    Berikan respon jawaban dengan format seperti contoh dibawah.
    ** Skor **: similiarity score menurut anda dalam satuan persen (%)\n
    ** ID BUMD **: ${s.id}\n
    ** Nama BUMD **: ${s.name}\n
    ** Penjelasan **: Jawaban secara lengkap\n
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jawaban = response.text(); // asli
    // const jawaban = '** skor **: 50% \n ini penjelasan dari Gemini API'; // dummy
    
    const arrayQueryResult = {
      "_id": s.id,
      "name": s.name,
      "desc": s.desc,
      "perda": s.perda,
      "penjelasan": jawaban,
    };

    return arrayQueryResult;
  }));

  return await promptsPerSource;
};