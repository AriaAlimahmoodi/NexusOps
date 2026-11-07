/**
 * Postgres Chat Memory Node - Version 1
 * Stores the chat history in Postgres table.
 */


export interface LcMemoryPostgresChatV1Params {
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
}

export interface LcMemoryPostgresChatV1Credentials {
  postgres: CredentialReference;
}

interface LcMemoryPostgresChatV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryPostgresChat';
  version: 1;
}

export type LcMemoryPostgresChatV1ParamsNode = LcMemoryPostgresChatV1NodeBase & {
  config: NodeConfig<LcMemoryPostgresChatV1Params> & { credentials?: LcMemoryPostgresChatV1Credentials };
};

export type LcMemoryPostgresChatV1Node = LcMemoryPostgresChatV1ParamsNode;