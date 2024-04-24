import express from 'express';
import { ObjectId } from 'mongodb';
// import { dbClient } from './mongodb_handler.js'
import * as myembed from './embedding.js';
import * as pc from './pinecone.js';
import { router } from './router.js';
import { initConnection } from './mongodb_handler.js';
import cors from 'cors';

const app = express();
const port = parseInt(process.env.PORT) || 8080;

// app.get('/', (req, res) => {
//   res.send('Hello ! YES')
// })

app.use('/', router);
app.use(cors());

try {
  await initConnection()
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  });
  
  // console.log("client is:", mongoDbHandler.dbClient); 
} catch(error) {
  console.log(error) 
}; 