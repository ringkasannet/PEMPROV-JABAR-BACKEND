import express from "express";
import https from "https";
import cors from "cors";
import fs from "fs";
import { router } from "./router/mainRouter";
import { initConnection } from "./mongodb_handler";
import { dmsRouter } from "./router/dmsRouter";
import { asetRouter } from "./router/asetRouter";
import { bumdRouter } from "./router/bumdRouter";
const app = express();

const port = parseInt(process.env.PORT) || 8080;
app.use(express.json());
app.use(cors());
app.use("/", router);
app.use("/dms", dmsRouter);
app.use("/aset", asetRouter);
app.use("/bumd", bumdRouter);

function init() {
    try {
        initConnection().then(() => {
            app.listen(port, () => {
                console.log(`Listen on port ${port}...`);
            });
        });
    } catch (error) {
        console.log(error);
    } 
}

init();
