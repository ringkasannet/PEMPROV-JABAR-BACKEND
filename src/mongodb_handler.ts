import { Collection, MongoClient, ServerApiVersion } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_DB_URI;

export let dbClient: MongoClient;

const dbName = "Cluster0";

let colNameBUMD:string;
let colNameAset:string;



if (process.env.NODE_ENV === "development") {
  console.log("using development mongoDB");
  colNameBUMD = "bumd";
  colNameAset = "asset";
} else if (process.env.NODE_ENV === "production"){
  console.log("using production mongoDB");
  colNameBUMD = "bumd";
  colNameAset = "asset";
}

export let collectionBUMD:Collection = null;
export let collectionAset:Collection = null;

export async function checkConnection() {
  try {
    await dbClient.db("admin").command({ ping: 1 });
    console.log(
      `Pinged your deployment. You successfully connected to MongoDB!`,
    );
    return true;
  } catch (error) {
    return false;
    throw error;
  }
}

export async function initConnection() {
  dbClient = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    // Connect the client to the server	(optional starting in v4.7)
    await dbClient.connect();
    await checkConnection();
    collectionBUMD = await dbClient.db(dbName).collection(colNameBUMD);
    collectionAset = await dbClient.db(dbName).collection(colNameAset);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function closeConnection() {
  try {
    await dbClient.close();
    return true;
  } catch (error) {
    return false;
  }
}
