import { ObjectId } from 'mongodb';
import { collectionBUMD } from './mongodb_handler.js';
import { processGeminiWithFile } from './geminiAI.js';
import { get } from 'https';
import { getBUMDDescPrompt, getBUMDInfoPrompt, getBUMDPasalPrompt } from './prompt.js';
 
// import { parsePdf, docPerda } from "./pdfHandler"; 

// export const doc = await parsePdf(docPerda);
// console.log("peraturan perda document:", doc);


// input document perda
// output: nomor peraturan, tahun, nama PT, pasal yang mengatur tujuan
export async function BUMDExtractor(file){
  // console.log(docPerda);

  let BUMDInfo = null;
  try {
    BUMDInfo = await processGeminiWithFile(file, getBUMDInfoPrompt(), true);
  } catch (error) {
    console.log(error);
  };
  // console.log(BUMDInfo);
  
  let BUMDDescription = null;
  try {
    BUMDDescription = await processGeminiWithFile(file, getBUMDDescPrompt(), false);
  } catch (error) {
    console.log(error);
    throw error;
  };
  // console.log(BUMDDescription);

  let BUMDPasalDesc = null;
  try {
    BUMDPasalDesc = await processGeminiWithFile(file, getBUMDPasalPrompt(), true);
  } catch (error) {
    console.log(error);
    throw error;
  };
  // console.log(BUMDPasalDesc);

  let result = {
    desc: BUMDDescription,
  };

  BUMDPasalDesc.pasal.forEach(pasal => {
    result.desc += '\n\n' + pasal.value;
  });

  result._id = new ObjectId();
  result.name = BUMDInfo.name;
  result.perda = BUMDInfo.perda;
  result.propertyName = true;
  result.embedding = false;
  // console.log(result);

  return result;
};
