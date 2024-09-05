import { ObjectId } from 'mongodb';
export declare function getAllBUMD(): Promise<BUMD[]>;
export type BUMD = {
    id?: string;
    _id?: ObjectId;
    name: string;
    desc: string;
    perda: string;
    embedding: boolean;
};
export declare function getBUMDNotEmbedded(): Promise<BUMD[]>;
export declare function getSampleBUMD(): Promise<import("mongodb").WithId<import("bson").Document>[]>;
export declare function getBumdFromId(id: string): Promise<BUMD[]>;
export declare function processEmbeddings(): Promise<string[]>;
export declare function processQuery(query: string, n: number, model: string): Promise<{
    _id: string;
    name: string;
    desc: string;
    perda: string;
    penjelasan: string;
}[]>;
export declare function getBUMDCandidate(query: string, num?: number): Promise<BUMD[]>;
export declare function evaluasiBUMD(query: string, bumd: BUMD): Promise<import("openai/streaming").Stream<import("openai/resources").ChatCompletionChunk>>;
export declare function removePropertyMongoDb(propertyName: string): Promise<void>;
export declare function addPropertyMongoDb(propertyName: string, propertyValue: any): Promise<void>;
export declare function savePerdaBUMD(perdaBUMD: any): Promise<void>;
export declare function removeSelectedBUMDs(chunksID: string[]): Promise<void>;
