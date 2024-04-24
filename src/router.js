import express from 'express'
import { getAllBUMD, getBUMDNotEmbedded } from './dataHandler.js'


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
})
// define the about route
router.get('/about', (req, res) => {
    res.send('Ini alamat about')
})

router.get('/getAllBUMD', async (req, res) => {
    console.log('memanggil getAllBUMD')
    const listBUMD = await getAllBUMD()
    res.send(listBUMD)
})

// router.get('/getBUMDNotEmbedded', async (req, res) => {
//     console.log('memanggil getBUMDNotEmbedded')
//     const BUMDNotEmbedded = await getBUMDNotEmbedded()
//     console.log("not embedded:", BUMDNotEmbedded)
//     res.send(BUMDNotEmbedded)
// })


//processEmbedding
//getAllBUMD
//getRecommendedBUMD(userQuery): [{BUMD,score,explanation}]

//adminSystem


