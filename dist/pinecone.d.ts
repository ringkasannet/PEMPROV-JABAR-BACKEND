import { PineconeRecord } from "@pinecone-database/pinecone";
export declare function upsertToPineCone(vectors: Array<PineconeRecord>, context: string): Promise<void>;
export declare function matchVectorQuery(query: number[], n: number, context: string): Promise<import("@pinecone-database/pinecone").ScoredPineconeRecord<import("@pinecone-database/pinecone").RecordMetadata>[]>;
export declare function removeOneFromPinecone(chunkID: string, context: string): Promise<void>;
export declare function removeManyFromPinecone(chunkIDs: string[], context: string): Promise<void>;
export declare function getAllVector(context: string): Promise<import("@pinecone-database/pinecone").ListResponse>;
