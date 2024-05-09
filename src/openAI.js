import OpenAI from "openai";
import * as dotenv from "dotenv";
// import 'dotenv/config';

dotenv.config();
console.log(process.env);
console.log("dotenv.OPENAI_API_KEY: ", process.env.OPENAI_API_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function embedding(input) {
  console.log("fungsi embedding()");
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: input,
    encoding_format: "float",
  });

  return embedding.data[0].embedding;
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
    Perda: ${s.perda}
    Penjelasan Pendirian Berdasar Perda: ${s.desc}
    
    
    Anda hanya diizinkan untuk menjawab berdasarkan sumber yang telah diberikan.
    Jawablah pertanyaan yang berhubungan dengan sumber.
    
    ID sumber wajib dicantumkan dan ID sumber tidak boleh diubah sedikitpun.
    Nomor perda tidak boleh diubah sedikitpun.
    Berikan jawaban secara lengkap berdasarkan sumber.
    Berikan nomor perda dan nomor pasal yang mendukung jawaban.
    Nomor pasal wajib dicantumkan.

    Output:
    A. Skor: 50%\n
    B. ID BUMD: ${s.id}\n
    C. Nama BUMD: ${s.name}\n
    D. Penjelasan: Jawaban secara lengkap\n ====
    `;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "anda adalah ahli hukum tata negara secara khusus dalam mengevaluasi kesesuaian penugasan BUMD dengan landasan hukum." }],
        messages: [{ role: "user", content: prompt }],

        model: "gpt-4-turbo-preview",
      });

      const jawaban = completion.choices[0].message.content;
      // const jawaban = '** skor **: 50% \n ini penjelasan dari Gemini API'; // dummy

      const arrayQueryResult = {
        _id: s.id,
        name: s.name,
        desc: s.desc,
        perda: s.perda,
        penjelasan: jawaban,
      };

      return arrayQueryResult;
    })
  );

  return await promptsPerSource;
}

export async function evaluasiBUMDPrompt(query, bumd) {
  console.log("fungsi evaluasiBUMDPrompt()", query, bumd.name);

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
    Nama BUMD: ${bumd.name} 
    ID Sumber: ${bumd.id}
    Perda: ${bumd.perda}
    Penjelasan Pendirian Berdasar Perda: ${bumd.desc}
    
    
    Anda hanya diizinkan untuk menjawab berdasarkan sumber yang telah diberikan.
    Jawablah pertanyaan yang berhubungan dengan sumber.
    
    Berikan jawaban secara lengkap berdasarkan sumber menggunakan markdown format. Berikan judul dan outline yang jelas.  
    Berikan nomor perda dan nomor pasal yang mendukung jawaban.
    Nomor pasal wajib dicantumkan.

    ========Output:======
    ***Analisis Kesesuaian Penugasan dengan Tujuan BUMD***
    ##Skor: 50%\n##
    ###Dasar Hukum: ${bumd.perda}###
    Penugasan ... pada ...
    `;

  const stream = await openai.chat.completions.create({
    messages: [{ role: "system", content: "anda adalah ahli hukum tata negara secara khusus dalam mengevaluasi kesesuaian penugasan BUMD dengan landasan hukum. Dalam memberikan jawaban anda selalu merujuk pada peraturan hukum yang berlaku dan analisis hukum yang mendalam" }],
    messages: [{ role: "user", content: prompt }],

    model: "gpt-4-turbo-preview",
    stream:true
  });


  return stream;
}
