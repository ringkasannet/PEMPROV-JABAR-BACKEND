import express from 'express';
import {
  getAllBUMD,
  processEmbeddings,
  processQuery,
  addPropertyMongoDb } from './dataHandler.js';

export const router = express.Router();

const timeLog = (req, res, next) => {
  console.log('Time:', Date.now());
  next();
};

router.use(timeLog);

router.get('/', (req, res) => {
  res.send(`halaman root`);
});

router.get('/about', (req, res) => {
  res.send(`halaman about`);
});

router.get('/getAllBUMD', async (req, res) => {
  console.log(`halaman getAllBUMD`);
  const listBUMD = await getAllBUMD();
  res.send(listBUMD);
});

router.get('/processEmbeddings', async (req, res) => {
  console.log(`halaman processEmbeddings`);
  try {
    const embeddedDoc = await processEmbeddings();
    console.log(`got docs: ${embeddedDoc}`);
    res.send(embeddedDoc);
  } catch (error) {
    res.status(500).send(error);
  };
});

router.get('/askQuestion/:query', async (req, res) => {
  console.log('halaman /askQuestion/:query');
  try {
    const queryResults = await processQuery(req.params.query);
    res.send(queryResults);
  } catch (error) {
    console.log(error);
    res.send(error);
  };
});

router.get('/addProperty/:propName/:propValue', (req, res) => {
  addPropertyMongoDb(req.params.propName, req.params.propValue);
  res.send({status: 'ok'});
});