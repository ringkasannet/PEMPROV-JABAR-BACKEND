import express from 'express';
import https from 'https';
import cors from 'cors';
import fs from 'fs';

import { router } from "./router.js";
import { initConnection } from './mongodb_handler.js';

const app = express();

const port = parseInt(process.env.PORT) || 3000;
app.use(express.json());
app.use(cors());
app.use('/', router);

const options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
  passphrase: 'ringkasan.net'
};



try {
  await initConnection();
  const server=https.createServer(options, app).listen(3000, () => {
    console.log('HTTPS server running on https://localhost:3000');
  });

  // app.listen(port, () => {
  //   console.log(`Listen on port ${port}...`);
  // });
  
} catch(error){
  console.log(error);
};