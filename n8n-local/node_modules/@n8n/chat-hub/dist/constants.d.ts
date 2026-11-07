import { type ChatHubLLMProvider, type ChatHubSemanticSearchSettings } from '@n8n/api-types';
export declare const DEFAULT_CONTEXT_WINDOW_LENGTH = 20;
export type NodeTypeNameVersion = {
    name: string;
    version: number;
};
export declare const EMBEDDINGS_NODE_TYPE_MAP: Partial<Record<ChatHubLLMProvider, NodeTypeNameVersion>>;
export declare const DEFAULT_SEMANTIC_SEARCH_SETTINGS: ChatHubSemanticSearchSettings;
