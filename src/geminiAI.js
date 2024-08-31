import * as dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { SchemaType } from '@google/generative-ai';

import { createPrompt, asetPrompt, asetPromptDummy } from "./prompt.js";


dotenv.config();
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);

export async function listUploadedFileToGemini(){
  const files = await fileManager.listFiles();
  return files.files;
}

export async function getUploadedFileToGemini(displayName){
  const files = await listUploadedFileToGemini(); 
  const file=files.find(file=>file.displayName===displayName);
  return file;
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const modelExtractor = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function uploadToGemini(pdfPath) {
  console.log(`upload "${pdfPath}" to Gemini ...`);

  const uploadFile = await fileManager.uploadFile(pdfPath, {
    mimeType: "application/pdf",
    displayName: pdfPath,
  });

  const file = uploadFile.file;
  // console.log(`'${file.displayName}' as '${file.name}' was uploaded`);

  return file;
}

export async function checkActiveFiles(pdf) {
  console.log(`check if file is ready to use or not ...`);
  // console.log(pdf);
  let file = await fileManager.getFile(pdf.name);

  while (file.state === "PROCESSING") {
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    file = await fileManager.getFile(pdf.name);
  }

  if (file.state !== "ACTIVE") {
    throw Error(`${file.displayName} failed to process`);
  }

  console.log('file ready to process!');
};

export async function queryAnalysis(query) {
  console.log("fungsi queryAnalysis()");

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
  } catch (error) {
    // console.log(error);
    console.log("queryAnalysis() return a non-valid JSON format!");
    return {
      jenis: "penjabaran",
    };
  }
}

export async function penjabaranPrompt(query, sources) {
  console.log("fungsi penjabaranPrompt()");

  const promptsPerSource = Promise.all(
    sources.map(async (s) => {
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
    }),
  );

  return await promptsPerSource;
}

export async function penjelasanPrompt(query, sources) {
  console.log("fungsi penjelasanPrompt()");

  //query: penugasan pembangunan fasilitas air bersih
  const promptsPerSource = Promise.all(
    sources.map(async (s) => {
      const prompt = `
    Tugas anda adalah menentukan kesesuaian potensi penugasan dari pemerintah daerah 
    dengan tujuan pendirian perusahaan BUMD berdasarkan sumber dokumen hukum terlampir. 
    Dari setiap potensi penugasan, berikan:
    a. skor persentase kesesuaian potensi penugasan dengan tujuan pendirian BUMD
    b. penjelasan kesesuaian secara mendetail dan komprehensif,  mempertimbangkan:
      - Apakah penugasan tersebut sesuai dengan tujuan pendirian BUMD
      - Apakah domain pekerjaan masih dalam ruang lingkup yang sama/terkait
      - Apakah penugasan sesuai dengan proses bisnis perusahaan
      - Apakah penugasan tidak keluar terlalu jauh dari inti dasar pekerjaan yang dilakukan perusahaan saat ini
    Berikan penjelasan secara lengkap dan jelas, serta berikan nomor pasal yang mendukung jawaban.

    Potensi penugasan: ${query}
    ID Sumber: ${s.id}
    Sumber: ${s.desc}
    
    Anda hanya diizinkan untuk menjawab berdasarkan sumber yang telah diberikan.
    Jawablah pertanyaan yang berhubungan dengan sumber.
    
    ID sumber wajib dicantumkan dan ID sumber tidak boleh diubah sedikitpun.
    Nomor perda tidak boleh diubah sedikitpun.
    Berikan jawaban secara lengkap berdasarkan sumber.
    Berikan semua nomor pasal yang mendukung jawaban.
    Nomor pasal wajib dicantumkan.

    Berikan respon jawaban dengan format seperti contoh dibawah.
    A. Skor: 50%\n
    B. ID BUMD: ${s.id}\n
    C. Nama BUMD: ${s.name}\n
    D. Penjelasan: Jawaban secara lengkap\n ====
    `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jawaban = response.text(); // asli
      // const jawaban = '** skor **: 50% \n ini penjelasan dari Gemini API'; // dummy

      const arrayQueryResult = {
        _id: s.id,
        name: s.name,
        desc: s.desc,
        perda: s.perda,
        penjelasan: jawaban,
      };

      return arrayQueryResult;
    }),
  );

  return await promptsPerSource;
}

export async function penjelasanPromptBulk(query, sources) {
  console.log("fungsi penjelasanPrompt()");

  //query: penugasan pembangunan fasilitas air bersih
  const daftarPerusahaan = `
    1. ${sources[0].name}
    **ID**: ${sources[0].id}
    **PERDA**: ${sources[0].perda}
    **DESKRIPSI**: ${sources[0].desc}
    
    2. ${sources[1].name}
    **PERDA**: ${sources[1].perda}
    **DESKRIPSI**: ${sources[1].desc}
    
    3. ${sources[2].name}
    **PERDA**: ${sources[2].perda}
    **DESKRIPSI**: ${sources[2].desc}

    4. ${sources[3].name}
    **PERDA**: ${sources[3].perda}
    **DESKRIPSI**: ${sources[3].desc}
    
    5. ${sources[4].name}
    **PERDA**: ${sources[4].perda}
    **DESKRIPSI**: ${sources[4].desc}
    `;
  const prompt = `
    Tugas anda adalah menentukan kesesuaian potensi penugasan dari pemerintah daerah 
    dengan tujuan pendirian perusahaan BUMD, dari "potensi petugasan yang ditanyakan" di bawah. 
    
    Untuk menentukan kesesuaian tersebut, anda akan menerima DAFTAR PERUSAHAAN yang berisikan nama perusahaan, nomor perda, dan deskripsi perusahaan.

    Untuk masing-masing perusahaan, urutkan perusahaan yang menurut anda paling dapat sesuai untuk menerima penugasan tersebut. 
    Setelah itu, untuk masing-masing perusahaan berikan:
    a. evaluasi kesesuaian secara mendetail dan komprehensif, serta membahas pasal terkait potensi penugasan dengan tujuan pendirian BUMD, meliputi antara lain:
    - Apakah penugasan tersebut sesuai dengan tujuan pendirian BUMD
    - Apakah domain pekerjaan masih dalam ruang lingkup yang sama/terkait
    - Apakah penugasan sesuai dengan proses bisnis perusahaan
    - Apakah penugasan tidak keluar terlalu jauh dari inti dasar pekerjaan yang dilakukan perusahaan saat ini
    b. skor persentase kesesuaian potensi penugasan dengan tujuan pendirian BUMD
    
  
      
    ID sumber wajib dicantumkan dan ID sumber tidak boleh diubah sedikitpun.
    Nomor perda tidak boleh diubah sedikitpun.
    Berikan jawaban secara lengkap berdasarkan sumber, dan gunakan kalimat asli dalam pasal.
    Berikan semua nomor pasal yang mendukung jawaban.
    Nomor pasal wajib dicantumkan.


    ===============Potensi penugasan yang ditanyakan==========
    ${query}

    ===============DAFTAR PERUSAHAAN==========
    ${daftarPerusahaan}
    
    
    ===============OUTPUT==========

    Berikan respon jawaban dengan format seperti contoh dibawah.

    1. **Perusahaan xyz** 
    **ID**: 18343ke9kfk
    **Dasar Hukum**: Perda no .....
    **Skor**: 50%
    **Penjelasan**: Penugasan terkait .... sesuai dengan ...$

    2. **Perusahaan abc**

    `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const jawaban = response.text(); // asli
  // const jawaban = '** skor **: 50% \n ini penjelasan dari Gemini API'; // dummy

  // const arrayQueryResult = {
  //   "_id": s.id,
  //   "name": s.name,
  //   "desc": s.desc,
  //   "perda": s.perda,
  //   "penjelasan": jawaban,
  // };

  return jawaban;
}

export async function evaluasiBUMDPrompt(query, bumd) {
  console.log("fungsi evaluasiBUMDPrompt() di Gemini AI", query, bumd.name);
  const prompt = createPrompt(query, bumd);
  const stream = await model.generateContentStream(prompt);
  return stream;
}

export async function evaluasiAset(query, sources) {
  console.log("fungsi evaluasiAset()");

  const promptPerSources = Promise.all(
    sources.map(async (file) => {
      console.log(`prompt ${file.perda}`);
      // console.log(file.desc);

      // asli
      const prompt = asetPrompt(query, file.desc);
      // dummy
      // const prompt = asetPromptDummy(query, file.desc);

      const safe = {
        HARM_CATEGORY_HARASSMENT: "BLOCK_NONE",
        HARM_CATEGORY_HATE_SPEECH: "BLOCK_NONE",
        HARM_CATEGORY_SEXUALLY_EXPLICIT: "BLOCK_NONE",
        HARM_CATEGORY_DANGEROUS_CONTENT: "BLOCK_NONE",
      };

      try {
        const stream = await model.generateContentStream(prompt, safe);
        // const stream = await model.generateContentStream(prompt);
        const result = { id: file.id, penjelasan: stream };
        // console.log(result);

        return result;
      } catch (error) {
        console.log(error);
      }
    }),
  );

  return await promptPerSources;
}

export async function processGeminiWithFile(
  prompt,
  file = null,
  isJSON = false,
  jsonSchema = null,
) {
  let content = [];
  if (file) {
    const pdf = {
      mimeType: file.mimeType,
      fileUri: file.uri,
    };

    content.push({
      fileData: pdf,
    });
  }
  content.push({
    text: prompt,
  });

  let response = null;
  if (isJSON) {
    if (!jsonSchema) {
      throw new Error("JSON Schema is required for JSON response");
    }
    const modelExtractorJSON = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
      },
    });

    const request = await modelExtractorJSON.generateContent(content);
    try {
      response = JSON.parse(request.response.text());
    } catch (error) {
      throw new Error("failed to parse JSON response");
    }
  } else {
    const request = await modelExtractor.generateContent(content);
    response = request.response.text();
  }

  // console.log(response);
  return response;
}
