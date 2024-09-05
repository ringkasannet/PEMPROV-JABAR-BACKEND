import express from "express";
import { addPropertyMongoDb, evaluasiBUMD, getAllBUMD, getBUMDCandidate, getBumdFromId, processEmbeddings, processQuery } from "../bumdHandler";
import { evaluasiBUMDPrompt } from "../geminiAI";

export const bumdRouter = express.Router();

bumdRouter.get("/all", async (req, res) => {
    console.log(`halaman getAllBUMD`);
    const listBUMD = await getAllBUMD();
    res.send(listBUMD);
});

bumdRouter.get("/getAllBUMDID", async (req, res) => {
    console.log(`halaman getAllBUMDID`);
    const listBUMD = await getAllBUMD();
    const listBUMDID = listBUMD.map(item => {
      return item._id;
    });
    res.send(listBUMDID);
  });
  

bumdRouter.get("/processEmbeddings", async (req, res) => {
    console.log(`halaman processEmbeddings`);
    try {
        const embeddedDoc = await processEmbeddings();
        console.log(`got docs: ${embeddedDoc}`);
        res.send(embeddedDoc);
    } catch (error) {
        // res.status(500).send(error);
    }
});

bumdRouter.post("/askQuestion/:query/:model", async (req, res) => {
    console.log(
        "halaman /askQuestion/:query:",
        req.body.query,
        req.params.model,
    );
    try {
        const queryResults = await processQuery(
            req.body.query,
            5,
            req.params.model,
        ); //TODO sanitasi query
        res.send(queryResults);
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});

bumdRouter.post("/candidates/:num", async (req, res) => {
    console.log("In /getBUMDCandidate query:", req.body.query, req.params.num);
    if (!req.body.query) {
        res.status(400).send({ message: "query tidak boleh kosong" });
        return
    }
    try {
        const queryResults = await getBUMDCandidate(
            req.body.query,
            Number(req.params.num),
        ); //TODO sanitasi query
        res.send(queryResults);
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});

bumdRouter.post("/evaluasi/:bumdId/:model", async (req, res) => {
    // console.log(req.body)
    // res.send(req.body)
    try {
        console.debug(
            "in evaluasiBUMD, retrieving data from mongodb for bumd:",
            req.params.bumdId,
            " query: ",
            req.body.query,
        );
        const bumd = await getBumdFromId(req.params.bumdId);
        console.log("got bumd:", bumd[0].name);

        switch (req.params.model) {
            case "OpenAi":
                const streamOpenAi = await evaluasiBUMD(
                    req.body.query,
                    bumd[0],
                );
                for await (const chunk of streamOpenAi) {
                    if (chunk.choices[0].delta.content) {
                        res.write(chunk.choices[0].delta.content);
                    } else {
                    }
                }
                break;
            case "GeminiAi":
                const streamGemini = await evaluasiBUMDPrompt(
                    req.body.query,
                    bumd[0],
                );
                for await (const chunk of streamGemini.stream) {
                    const chunkText = chunk.text();
                    res.write(chunkText);
                }
                break;
            default:
                break;
        }
        // const streamOpenAi = await evaluasiBUMD(req.params.query, bumd[0]);

        // for await (const chunk of streamOpenAi) {
        //   // console.log(chunk.choices[0].delta.content);
        //   // console.info("chunk.choices[0].delta.content");
        //   if (chunk.choices[0].delta.content) {
        //     res.write(chunk.choices[0].delta.content);
        //     // res.write("halo");
        //   } else {
        //   }
        // }
        // res.end("done");
    } catch (error) {
        console.error("ditemukan error:", error);
        if ((req.params.model = "GeminiAi"))
            res.status(400).send({ message: await error.message });
        else res.status(400).send(error);
    }
});

bumdRouter.get("/addProperty/:propName/:propValue", (req, res) => {
    addPropertyMongoDb(req.params.propName, req.params.propValue);
    res.status(200).send("ok");
  });
  