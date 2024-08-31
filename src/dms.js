import { ObjectId } from "mongodb";
import { collectionBUMD } from "./mongodb_handler.js";
import { processGeminiWithFile } from "./geminiAI.js";
import { get } from "https";
import {
  getBUMDDescPrompt, getBUMDInfoPrompt, getBUMDPasalPrompt,
  getBUMDInfoPrompt,
  getCombineJSONPrompt,
  getBUMDExtractorPrompt,
} from "./prompt.js";
import { SchemaType } from "@google/generative-ai";

// import { parsePdf, docPerda } from "./pdfHandler";

// export const doc = await parsePdf(docPerda);
// console.log("peraturan perda document:", doc);

// input document perda
// output: nomor peraturan, tahun, nama PT, pasal yang mengatur tujuan
export async function BUMDExtractor(file) {
  // console.log(docPerda);


  let BUMDDescriptionJSON = null;
  const descSchema = {
    type: SchemaType.OBJECT,
    properties: {
      name: {
        type: SchemaType.STRING,
      },
      perda: {
        type: SchemaType.STRING,
      },
      pasal_terkait_tujuan: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            pasal: {
              type: SchemaType.STRING,
            },
            alasan: {
              type: SchemaType.STRING,
            },
          },
          // This line is crucial!
          required: ["pasal", "alasan"],
        },
      },
    },
  };

  try {
    console.time("get description json");
    BUMDDescriptionJSON = await processGeminiWithFile(
      getBUMDExtractorPrompt(),
      file,
      true,
      descSchema,
    );
    console.timeEnd("get description json");
  } catch (error) {
    console.log(error);
    throw error;
  }
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
  return BUMDDescriptionJSON
}
