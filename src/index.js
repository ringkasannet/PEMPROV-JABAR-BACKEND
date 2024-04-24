import express from "express";
import { ObjectId } from "mongodb";
// import { dbClient } from './mongodb_handler.js'
import * as myembed from "./embedding.js";
import * as pc from "./pinecone.js";
import { router } from "./router.js";
import { initConnection } from "./mongodb_handler.js";

const app = express();

// app.get('/', (req, res) => {
//   res.send('Hello ! YES')
// })

const port = parseInt(process.env.PORT) || 8080;

app.use("/", router);

try {
  await initConnection();
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
  // console.log("client is:", mongoDbHandler.dbClient);
} catch (error) {
  console.log(error);
}
