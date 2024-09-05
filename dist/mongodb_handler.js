"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeConnection = exports.initConnection = exports.checkConnection = exports.collectionAset = exports.collectionBUMD = exports.dbClient = void 0;
const mongodb_1 = require("mongodb");
const uri = "mongodb+srv://ringkasannet:lp1POBCzo98wlAYK@pemprov-jabar.cd5e79l.mongodb.net/?retryWrites=true&w=majority&appName=pemprov-jabar";
const dbName = "pemprov-jabar-bumd";
let colNameBUMD;
let colNameAset;
if (process.env.NODE_ENV === "development") {
    console.log("using development mongoDB");
    colNameBUMD = "test-bumd";
    colNameAset = "test-aset";
}
else if (process.env.NODE_ENV === "production") {
    console.log("using production mongoDB");
    colNameBUMD = "BUMD";
    colNameAset = "Asset";
}
exports.collectionBUMD = null;
exports.collectionAset = null;
async function checkConnection() {
    try {
        await exports.dbClient.db("admin").command({ ping: 1 });
        console.log(`Pinged your deployment. You successfully connected to MongoDB!`);
        return true;
    }
    catch (error) {
        return false;
        throw error;
    }
}
exports.checkConnection = checkConnection;
async function initConnection() {
    exports.dbClient = new mongodb_1.MongoClient(uri, {
        serverApi: {
            version: mongodb_1.ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await exports.dbClient.connect();
        await checkConnection();
        exports.collectionBUMD = await exports.dbClient.db(dbName).collection(colNameBUMD);
        exports.collectionAset = await exports.dbClient.db(dbName).collection(colNameAset);
        return true;
    }
    catch (error) {
        console.log(error);
        return false;
    }
}
exports.initConnection = initConnection;
async function closeConnection() {
    try {
        await exports.dbClient.close();
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.closeConnection = closeConnection;
//# sourceMappingURL=mongodb_handler.js.map