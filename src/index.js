import express from 'express'
import { dbClient } from './mongodb_handler.js'

const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello !')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const collection = dbClient.db("pemprov-jabar-bumd").collection("BUMD");

const findResult = await collection.find({}).toArray();
console.log('Found documents =>', findResult);