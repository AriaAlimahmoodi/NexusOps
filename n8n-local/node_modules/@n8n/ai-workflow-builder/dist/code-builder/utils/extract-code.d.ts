export declare const SDK_IMPORT_STATEMENT = "import { workflow, node, trigger, sticky, placeholder, newCredential, ifElse, switchCase, merge, splitInBatches, nextBatch, languageModel, memory, tool, outputParser, embedding, embeddings, vectorStore, retriever, documentLoader, textSplitter, reranker, fromAi, expr } from '@n8n/workflow-sdk';";
export declare function stripImportStatements(code: string): string;
export declare function extractWorkflowCode(response: string): string;
