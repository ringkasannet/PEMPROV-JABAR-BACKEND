import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = 'mongodb+srv://ringkasannet:lp1POBCzo98wlAYK@pemprov-jabar.cd5e79l.mongodb.net/?retryWrites=true&w=majority&appName=pemprov-jabar';

export let dbClient;

const dbName = 'pemprov-jabar-bumd';
const colNameBUMD = 'BUMD';

export let collectionBUMD = null;

export async function checkConnection(){
  try {
    await dbClient.db('admin').command({ ping: 1 });
    console.log(`Pinged your deployment. You successfully connected to MongoDB!`);
    return true;
  } catch (error) {
    return false;
    throw error;
  };
};

export async function initConnection(){
  dbClient = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    // Connect the client to the server	(optional starting in v4.7)
    await dbClient.connect();
    await checkConnection();
    collectionBUMD = await dbClient.db(dbName).collection(colNameBUMD);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  };
};

export async function closeConnection(){
  try {
    await dbClient.close();
    return true;
  } catch (error) {
    return false;
  };
};