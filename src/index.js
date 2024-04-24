import express from 'express';
import { ObjectId } from 'mongodb';
// import { dbClient } from './mongodb_handler.js'
import { router } from "./router.js";
import { initConnection } from "./mongodb_handler.js";
import cors from 'cors';

// app.get('/', (req, res) => {
//   res.send('Hello ! YES')
// })
const app = express();
const port = parseInt(process.env.PORT) || 3000;

app.use(cors());
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
