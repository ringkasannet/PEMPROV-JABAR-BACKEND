import { ResponseSchema } from "@google/generative-ai";
import { FileMetadataResponse } from "@google/generative-ai/server";
import { BUMD } from "./bumdHandler";
export declare function listUploadedFileToGemini(): Promise<FileMetadataResponse[]>;
export declare function getUploadedFileToGemini(displayName: string): Promise<FileMetadataResponse>;
export declare function uploadToGemini(pdfPath: string, fileName?: string): Promise<FileMetadataResponse>;
export declare function checkActiveFiles(file: FileMetadataResponse): Promise<void>;
export declare function queryAnalysis(query: string): Promise<any>;
export declare function penjabaranPrompt(query: string, sources: BUMD[]): Promise<string[]>;
export declare function penjelasanPrompt(query: string, sources: BUMD[]): Promise<{
    _id: string;
    name: string;
    desc: string;
    perda: string;
    penjelasan: string;
}[]>;
export declare function penjelasanPromptBulk(query: string, sources: BUMD[]): Promise<string>;
export declare function evaluasiBUMDPrompt(query: string, bumd: BUMD): Promise<import("@google/generative-ai").GenerateContentStreamResult>;
export declare function evaluasiAset(query: string, sources: any[]): Promise<{
    id: any;
    penjelasan: import("@google/generative-ai").GenerateContentStreamResult;
}[]>;
export declare function processGeminiWithFile(prompt: string, file?: FileMetadataResponse, isJSON?: boolean, jsonSchema?: ResponseSchema): Promise<any>;
