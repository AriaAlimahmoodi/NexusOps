/**
 * Postgres Chat Memory Node - Version 1.3
 * Stores the chat history in Postgres table.
 */


export interface LcMemoryPostgresChatV13Params {
/**
 * Session ID
 * @builderHint Use 'Connected Chat Trigger Node' (fromInput) if there is a Chat Trigger node earlier in the workflow. Otherwise use 'Define below' (customKey).
 * @default fromInput
 */
    sessionIdType?: 'fromInput' | 'customKey' | Expression<string>;
/**
 * The key to use to store session ID in the memory
 * @displayOptions.show { sessionIdType: ["customKey"] }
 */
    sessionKey?: string | Expression<string>;
/**
 * The table name to store the chat history in. If table does not exist, it will be created.
 * @default n8n_chat_histories
 */
    tableName?: string | Expression<string>;
/**
 * Context Window Length
 * @hint How many past interactions the model receives as context
 * @default 5
 */
    contextWindowLength?: number | Expression<number>;
}

export interface LcMemoryPostgresChatV13Credentials {
  postgres: CredentialReference;
}

interface LcMemoryPostgresChatV13NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryPostgresChat';
  version: 1.3;
}

export type LcMemoryPostgresChatV13ParamsNode = LcMemoryPostgresChatV13NodeBase & {
  config: NodeConfig<LcMemoryPostgresChatV13Params> & { credentials?: LcMemoryPostgresChatV13Credentials };
};

export type LcMemoryPostgresChatV13Node = LcMemoryPostgresChatV13ParamsNode;