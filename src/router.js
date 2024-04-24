import express from 'express'
import { getAllBUMD, getBUMDNotEmbedded, addPropertyMongoDb, processEmbeddings, processQuery } from './dataHandler.js'

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

router.get('/about', (req, res) => {
    res.send('Ini alamat about')
});

router.get('/getAllBUMD', async (req, res) => {
    console.log('memanggil getAllBUMD');
    const listBUMD = await getAllBUMD();
    res.send(listBUMD);
});

router.get('/processEmbeddings', async (req, res) => {
    try {
        const embededDoc = await processEmbeddings();
        console.log("got docs:", embededDoc);
        res.send(embededDoc); 
    } catch(error){
        res.status(500).send(error)
    }
})

router.get('/askQuestion/:query', async(req, res) => {
    try {
        const query = await processQuery(req.params.query);
        res.send(query); 
    } catch(error){
        console.log(error)
        res.send(error)
    }
})

router.get('/addProperty/:propName/:propValue', (req, res) => {
    addPropertyMongoDb(req.params.propName, req.params.propValue);
    res.send({status: 'ok'})
})