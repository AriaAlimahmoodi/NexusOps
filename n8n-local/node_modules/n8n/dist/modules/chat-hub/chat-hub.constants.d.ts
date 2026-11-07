import type { ChatHubLLMProvider, ChatHubVectorStoreProvider, ChatModelMetadataDto } from '@n8n/api-types';
import type { ExecutionStatus, INodeTypeNameVersion } from 'n8n-workflow';
import type { ChatTriggerResponseMode } from './chat-hub.types';
export type ChatHubInputModality = 'text' | 'image' | 'audio' | 'video' | 'file';
export interface InternalModelMetadata extends ChatModelMetadataDto {
    inputModalities: ChatHubInputModality[];
}
export declare const EXECUTION_POLL_INTERVAL = 1000;
export declare const STREAM_CLOSE_TIMEOUT: number;
export declare const EXECUTION_FINISHED_STATUSES: ExecutionStatus[];
export declare const TOOLS_AGENT_NODE_MIN_VERSION = 2.2;
export declare const CHAT_TRIGGER_NODE_MIN_VERSION = 1.2;
export declare const PROVIDER_NODE_TYPE_MAP: Record<ChatHubLLMProvider, INodeTypeNameVersion>;
export declare const NODE_NAMES: {
    readonly CHAT_TRIGGER: 'When chat message received';
    readonly REPLY_AGENT: 'AI Agent';
    readonly TITLE_GENERATOR_AGENT: 'Title Generator Agent';
    readonly CHAT_MODEL: 'Chat Model';
    readonly EMBEDDINGS_MODEL: 'Embeddings Model';
    readonly VECTOR_STORE: 'Vector Store';
    readonly DEFAULT_DATA_LOADER: 'Default Data Loader';
    readonly MEMORY: 'Memory';
    readonly RESTORE_CHAT_MEMORY: 'Restore Chat Memory';
    readonly CLEAR_CHAT_MEMORY: 'Clear Chat Memory';
    readonly MERGE: 'Merge';
};
export declare const JSONL_STREAM_HEADERS: {
    'Content-Type': string;
    'Transfer-Encoding': string;
    'Cache-Control': string;
    Connection: string;
};
export declare function getModelMetadata(provider: ChatHubLLMProvider, modelId: string): InternalModelMetadata;
export declare const SUPPORTED_RESPONSE_MODES: ChatTriggerResponseMode[];
export declare const VECTOR_STORE_NODE_TYPE_MAP: Record<ChatHubVectorStoreProvider, string>;
