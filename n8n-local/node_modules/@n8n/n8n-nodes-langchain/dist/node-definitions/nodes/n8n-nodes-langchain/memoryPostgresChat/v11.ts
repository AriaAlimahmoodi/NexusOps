/**
 * Postgres Chat Memory Node - Version 1.1
 * Stores the chat history in Postgres table.
 */


export interface LcMemoryPostgresChatV11Params {
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

export interface LcMemoryPostgresChatV11Credentials {
  postgres: CredentialReference;
}

interface LcMemoryPostgresChatV11NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryPostgresChat';
  version: 1.1;
}

export type LcMemoryPostgresChatV11ParamsNode = LcMemoryPostgresChatV11NodeBase & {
  config: NodeConfig<LcMemoryPostgresChatV11Params> & { credentials?: LcMemoryPostgresChatV11Credentials };
};

export type LcMemoryPostgresChatV11Node = LcMemoryPostgresChatV11ParamsNode;