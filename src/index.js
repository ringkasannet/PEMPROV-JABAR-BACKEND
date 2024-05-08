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
  key: fs.readFileSync('/etc/letsencrypt/live/ringkasan.net/privkey.pem', 'utf8'),
  cert: fs.readFileSync('/etc/letsencrypt/live/ringkasan.net/cert.pem','utf8'),
  ca : fs.readFileSync('/etc/letsencrypt/live/ringkasan.net/chain.pem', 'utf8')
};



try {
  await initConnection();
  const server=https.createServer(options, app).listen(443, () => {
    console.log('HTTPS server running on https://localhost:3000');
  });

  // app.listen(port, () => {
  //   console.log(`Listen on port ${port}...`);
  // });
  
} catch(error){
  console.log(error);
};