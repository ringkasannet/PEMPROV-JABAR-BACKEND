import express from 'express'
import { ObjectId } from 'mongodb';
// import { dbClient } from './mongodb_handler.js'
import * as myembed from './embedding.js'
import * as pc from './pinecone.js'
import { router } from './router.js';
import { initConnection } from './mongodb_handler.js';

const app = express()
const port = 3000

// app.get('/', (req, res) => {
//   res.send('Hello ! YES')
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

app.use('/', router)

try {
  await initConnection()
  // console.log("client is:", mongoDbHandler.dbClient); 
} catch (error) {
  console.log(error)
}
