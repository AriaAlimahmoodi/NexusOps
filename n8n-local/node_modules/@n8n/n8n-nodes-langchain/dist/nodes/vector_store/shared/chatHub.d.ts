import type { Document } from '@langchain/core/documents';
export declare const CHAT_HUB_RETRIEVE_METADATA_KEYS: Set<string>;
export declare function filterChatHubMetadata(metadata: Record<string, unknown>, allowedKeys: Set<string>): Record<string, unknown>;
export declare function filterChatHubInsertDocuments(documents: Array<Document<Record<string, unknown>>>): Array<Document<Record<string, unknown>>>;
