/**
 * Postgres Chat Memory Node - Version 1.4
 * Stores the chat history in Postgres table.
 */


export interface LcMemoryPostgresChatV14Params {
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

export interface LcMemoryPostgresChatV14Credentials {
  postgres: CredentialReference;
}

interface LcMemoryPostgresChatV14NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryPostgresChat';
  version: 1.4;
}

export type LcMemoryPostgresChatV14ParamsNode = LcMemoryPostgresChatV14NodeBase & {
  config: NodeConfig<LcMemoryPostgresChatV14Params> & { credentials?: LcMemoryPostgresChatV14Credentials };
};

export type LcMemoryPostgresChatV14Node = LcMemoryPostgresChatV14ParamsNode;