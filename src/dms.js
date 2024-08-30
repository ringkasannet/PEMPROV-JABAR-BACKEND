import { GoogleAIFileManager } from '@google/generative-ai/server';

// import { parsePdf, docPerda } from "./pdfHandler";

// export const doc = await parsePdf(docPerda);
// console.log("peraturan perda document:", doc);

// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);

async function uploadToGemini(pdfPath){
  console.log(`upload "${pdfPath}" to Gemini ...`);

  const uploadFile = await fileManager.uploadFile(pdfPath, {
    mimeType: 'application/pdf',
    displayName: pdfPath,
  });

  const file = uploadFile.file;
  // console.log(`'${file.displayName}' as '${file.name}' was uploaded`);

  return file;
};

async function checkActiveFiles(files){
  console.log(`check if file is ready to use or not ...`);

  for (const pdf of files.map((file) => file.name)){
    let file = await fileManager.getFile(pdf);
    
    while (file.state === 'PROCESSING'){
      process.stdout.write('.');
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      file = await fileManager.getFile(pdf);
    };

    if (file.state !== 'ACTIVE'){
      throw Error(`${file.displayName} failed to process`);
    };
  };

  console.log('all files ready to process!');
};

// input document perda
// output: nomor peraturan, tahun, nama PT, pasal yang mengatur tujuan
export async function BUMDExtractor(docPerda){

  // const file = await uploadToGemini(docPerda);
  // const filePromise = await Promise.all(files);


  return localPdf;
};
