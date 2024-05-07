import express from 'express';
import cors from 'cors';

import { router } from "./router.js";
import { initConnection } from './mongodb_handler.js';

const app = express();
const port = parseInt(process.env.PORT) || 3000;

app.use(cors());
app.use('/', router);

try {
  await initConnection();

  app.listen(port, () => {
    console.log(`Listen on port ${port}...`);
  });
  
} catch(error){
  console.log(error);
};