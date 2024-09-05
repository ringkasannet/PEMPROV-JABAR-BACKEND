import { Collection, MongoClient } from "mongodb";
export declare let dbClient: MongoClient;
export declare let collectionBUMD: Collection;
export declare let collectionAset: Collection;
export declare function checkConnection(): Promise<boolean>;
export declare function initConnection(): Promise<boolean>;
export declare function closeConnection(): Promise<boolean>;
