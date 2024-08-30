import { ObjectId } from 'mongodb';
import { collectionBUMD } from './mongodb_handler.js';
import { processGeminiWithFile } from './geminiAI.js';
import { get } from 'https';
import { getBUMDDescPrompt } from './prompt.js';
 
// import { parsePdf, docPerda } from "./pdfHandler"; 

// export const doc = await parsePdf(docPerda);
// console.log("peraturan perda document:", doc);


// input document perda
// output: nomor peraturan, tahun, nama PT, pasal yang mengatur tujuan
export async function BUMDExtractor(file){
  // console.log(docPerda);

  // let BUMDInfo = null;
  // try {
  //   BUMDInfo = await processGeminiWithFile(pdfSource,getBUMDInfoPrompt(),true);
  // } catch (error) {
  //   console.log(error);
  // };

  let BUMDDescription = null;
  try {
    BUMDDescription = await processGeminiWithFile(file,getBUMDDescPrompt(),true);
  } catch (error) {
    console.log(error);
    throw error;
  };

  // const result = {
  //   _id: new ObjectId(),
  //   name: getJsonExtraction.name,
  //   perda: getJsonExtraction.perda,
  //   desc: getFileContent,
  //   propertyName: true,
  //   embedding: false,
  // };
  // // update ke mongo
  // console.log(`uploads ${result.perda} to mongodb...`);
  // await collectionBUMD.insertOne(result);

  // return result;
  return BUMDDescription;
};
