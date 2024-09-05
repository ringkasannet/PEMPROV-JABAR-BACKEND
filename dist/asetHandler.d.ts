import { ObjectId } from "mongodb";
export declare function splitChunks(chunksData: any[]): any[];
export declare function uploadAsetChunksToMongo(chunksData: any, perdaName: any): Promise<any>;
export declare function removePerdaChunks(perdaName: string): Promise<void>;
export declare function getAllAsetChunks(): Promise<import("mongodb").WithId<import("bson").Document>[]>;
export declare function getAsetNotEmbedded(): Promise<import("mongodb").WithId<import("bson").Document>[]>;
export declare function processAsetEmbeddings(): Promise<ObjectId[]>;
export declare function mergeChunks(chunksPerda: any[]): {
    id: string;
    perda: any;
    name: string;
    desc: string;
}[];
export declare function getAsetCandidate(query: string, topK: number): Promise<{
    id: string;
    perda: any;
    name: string;
    desc: string;
}[]>;
export declare function getAsetCandidateNotMerged(query: string, topK: number): Promise<import("mongodb").WithId<import("bson").Document>[]>;
export declare function processAsetQuery(query: string, model: string, topK: number): Promise<false | {
    id: any;
    penjelasan: import("@google/generative-ai").GenerateContentStreamResult;
}[]>;
export declare function savePerdaAset(perdaAset: any): Promise<void>;
export declare function removeSelectedPerdaAset(perdas: any[]): Promise<void>;
export declare function removeSelectedAsetChunks(chunksIDs: any[]): Promise<void>;
