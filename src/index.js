import express from 'express'
import { dbClient } from './mongodb_handler.js'
import { ObjectId } from 'mongodb';

const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello ! YES')
})

app.get('/cekKesesuaian', (req, res) => {

    //
    res.send('Hello ! YES')
  })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const collection = dbClient.db("pemprov-jabar-bumd").collection("BUMD");

const objectId = new ObjectId("662650b65f0d70008a1ac6e2");

const results = await collection.find({ _id: objectId }).toArray();
console.log('Found documents =>', results[0].name); 

//check all items in collection already embedded or not
//if not pinecone 