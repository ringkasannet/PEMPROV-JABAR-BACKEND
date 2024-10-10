import express from "express";
import fs from "fs";
import { getAllBUMD } from "../bumdHandler";
import { getAllAsetChunks } from "../asetHandler";
import { fetchAllVector, getAllVector, removeOneFromPinecone, upsertToPineCone } from "../pinecone";
import { collectionBUMD, collectionAset } from "../mongodb_handler";
import { ObjectId } from "mongodb";

export const migrasiRouter = express.Router();

migrasiRouter.get("/migrasi-mongo/:index", async (req, res) => {
  const indexName = req.params.index;
  console.log("migrasi-mongo:", indexName);
  
  let dbValues = null;
  switch (indexName) {
    case 'bumd':
      dbValues = await getAllBUMD();
      break;
    case 'aset':
      dbValues = await getAllAsetChunks();
      break;
    default:
      break;
  }
  
  console.log('mongodb: jumlah data', indexName, dbValues.length);
  fs.writeFileSync(`./public/mongo-${indexName}.txt`, JSON.stringify(dbValues));
  res.send(dbValues);
});

migrasiRouter.get("/migrasi-pinecone/:index", async (req, res) => {
  const indexName = req.params.index;
  console.log("migrasi-pinecone", indexName);
  
  try {
    const pineconeListId = await getAllVector(indexName);
    const idListObject = pineconeListId.vectors;
    const idList: string[] = [];
    idListObject.forEach(id => {
      idList.push(id.id);
    });

    const dbValuesObject = await fetchAllVector(indexName, idList);
    const dbValues = dbValuesObject.records;
    const validValueArray: any[] = [];
    for (const id in dbValues){
      validValueArray.push(dbValues[id]);
    }

    console.log('pinecone: jumlah data', indexName, validValueArray.length);
    fs.writeFileSync(`./public/pinecone-${indexName}.txt`, JSON.stringify(validValueArray));
    res.send(validValueArray);
    
  } catch (error) {
    res.send(error);
  }
});

migrasiRouter.get("/hapus-pinecone/:index/:pcId", async (req, res) => {
  await removeOneFromPinecone(req.params.pcId, req.params.index);
  res.send(`pinecone: done remove ${req.params.pcId}`);
});

migrasiRouter.get("/upload-mongo/:index", async (req, res) => {
  const indexName = req.params.index;
  console.log("upload-mongo:", indexName);
  const rawJson = fs.readFileSync(`./public/mongo-${indexName}.txt`, 'utf8');
  const jsonData = JSON.parse(rawJson);
  console.log('mongo: jumlah data', indexName, jsonData.length);
  for (const item of jsonData){
    const validId = new ObjectId(item._id);
    item._id = validId;
  }
  // console.log(jsonData);
  try {
    switch (indexName) {
      case 'bumd':
        await collectionBUMD.insertMany(jsonData);
        break;
      case 'aset':
        await collectionAset.insertMany(jsonData);
        break;
      default:
        break;
    }
    
    console.log(`upload mongo from file is done ${indexName}`);
    res.send(jsonData);
  } catch (error) {
    res.send(error);
  }
});

migrasiRouter.get("/upload-pinecone/:index", async (req, res) => {
  const indexName = req.params.index;
  console.log("upload-pinecone", indexName);
  
  const rawJson = fs.readFileSync(`./public/pinecone-${indexName}.txt`, 'utf8');
  const jsonData = JSON.parse(rawJson);
  console.log('pinecone: jumlah data', indexName, jsonData.length);
  try {
    await upsertToPineCone(jsonData, indexName);
    console.log(`upload pinecone from file is done ${indexName}`);
    res.send(jsonData);
  } catch (error) {
    res.send(error);
  }
});
