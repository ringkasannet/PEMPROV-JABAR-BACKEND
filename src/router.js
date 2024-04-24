import express from 'express'
import { getAllBUMD, getBUMDNotEmbedded, addPropertyMongoDb, processEmbeddings } from './dataHandler.js'

export const router = express.Router()

// middleware that is specific to this router
const timeLog = (req, res, next) => {
    console.log('Time: ', Date.now())
    next()
}

router.use(timeLog)

// define the home page route
router.get('/', (req, res) => {
    
    res.send('Ini alamat dasar router')
});
// define the about route
router.get('/about', (req, res) => {
    res.send('Ini alamat about')
});

router.get('/getAllBUMD', async (req, res) => {
<<<<<<< HEAD
    try {
        console.log('memanggil getAllBUMD')
        const listBUMD = await getAllBUMD()
        res.send(listBUMD)
    
    }catch(error){
        res.status(500).send(error.message);
=======
    console.log('memanggil getAllBUMD');
    const listBUMD = await getAllBUMD();
    res.send(listBUMD);
});

router.get('/getBUMDNotEmbedded', async (req, res) => {
    console.log('memanggil getBUMDNotEmbedded');
    const BUMDNotEmbedded = await getBUMDNotEmbedded();
    console.log("not embedded:", BUMDNotEmbedded);
    res.send(BUMDNotEmbedded);
});

router.get('/processEmbeddings', async (req, res) => {
    try {
        const embededDoc = await processEmbeddings();
        console.log("got docs:",embededDoc);
        res.send(embededDoc);
    } catch(error){
        res.status(500).send(error)
>>>>>>> update-embedding
    }
})
router.get('/getEmbedding', async (req, res) => {
  console.log('start getEmbedding');
  const embeddingDoc = await getEmbedding();
  // console.log(embeddingDoc);
  res.send(embeddingDoc);
});

router.get('/updateVDB', async (req, res) => {
  const update = await updateVDB();
  console.log('update pinecone vdb');
  res.send('update pinecone vdb');
});

router.get('/updateStatMongoDB', async (req, res) => {
    const update = await updateStatMongoDb();
    console.log('update status embedding di mongodb');
    res.send('update status embedding mongodb');
});

router.get('/addProperty/:propName/:propValue', (req, res) => {
    addPropertyMongoDb(req.params.propName, req.params.propValue);
    res.send({status: 'ok'})
})