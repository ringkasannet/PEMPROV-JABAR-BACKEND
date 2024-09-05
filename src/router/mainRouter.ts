import express from "express";
import { getAllVector, removeOneFromPinecone } from "../pinecone.js";

export const router = express.Router();

router.get("/", (req, res) => {
  res.send(`halaman root`);
});

router.get("/getAPiKey", (req, res) => {
  res.send(process.env.OPENAI_API_KEY);
});


router.get("/all-vector-ids/:context", async (req, res) => {
  try{
    const vectors= await getAllVector(req.params.context);
    res.send(vectors)
  } catch (error) {
    res.status(404).send(error.message)
  }
});

router.delete("/vector-id/:context", async (req, res) => {
  try{ 
    await removeOneFromPinecone(req.body.chunkId, req.params.context);
    res.send("Deleted") 
  } catch (error) {
    res.status(500).send(error.message)

  }
});

