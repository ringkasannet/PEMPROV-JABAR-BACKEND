import { ObjectId } from 'mongodb';
import { collectionBUMD } from './mongodb_handler.js';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { extractBUMDDescription, extractBUMDJSON } from './geminiAI.js';

// import { parsePdf, docPerda } from "./pdfHandler";

// export const doc = await parsePdf(docPerda);
// console.log("peraturan perda document:", doc);

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

async function checkActiveFiles(pdf){
  console.log(`check if file is ready to use or not ...`);
  console.log(pdf);
  let file = await fileManager.getFile(pdf.name);
  
  while (file.state === 'PROCESSING'){
    process.stdout.write('.');
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    file = await fileManager.getFile(pdf.name);
  };

  if (file.state !== 'ACTIVE'){
    throw Error(`${file.displayName} failed to process`);
  };

  console.log('all files ready to process!');
};

// input document perda
// output: nomor peraturan, tahun, nama PT, pasal yang mengatur tujuan
export async function BUMDExtractor(docPerda){
  // console.log(docPerda);
  const file = await uploadToGemini(docPerda);
  // console.log(file);
  await checkActiveFiles(file);
  const pdfSource = {
    mimeType: file.mimeType,
    fileUri: file.uri,
  }

  let getJsonExtraction = null;
  try {
    getJsonExtraction = await extractBUMDJSON(pdfSource);
  } catch (error) {
    console.log(error);
  };

  let getFileContent = null;
  try {
    getFileContent = await extractBUMDDescription(pdfSource);
  } catch (error) {
    console.log(error);
  };

  const result = {
    _id: new ObjectId(),
    name: getJsonExtraction.name,
    perda: getJsonExtraction.perda,
    desc: getFileContent,
    propertyName: true,
    embedding: false,
  };
  // update ke mongo
  console.log(`uploads ${result.perda} to mongodb...`);
  await collectionBUMD.insertOne(result);

  return result;
};
