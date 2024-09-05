import OpenAI from "openai";
import { BUMD } from "./bumdHandler";
export declare function embedding(input: string): Promise<number[]>;
export declare function evaluasiBUMDPrompt(query: string, bumd: BUMD): Promise<import("openai/streaming").Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>;
