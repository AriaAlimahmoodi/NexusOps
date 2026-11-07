/**
 * Redis Chat Memory Node - Version 1.3
 * Stores the chat history in Redis.
 */


export interface LcMemoryRedisChatV13Params {
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
 * For how long the session should be stored in seconds. If set to 0 it will not expire.
 * @default 0
 */
    sessionTTL?: number | Expression<number>;
/**
 * Context Window Length
 * @hint How many past interactions the model receives as context
 * @default 5
 */
    contextWindowLength?: number | Expression<number>;
}

export interface LcMemoryRedisChatV13Credentials {
  redis: CredentialReference;
}

interface LcMemoryRedisChatV13NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryRedisChat';
  version: 1.3;
}

export type LcMemoryRedisChatV13ParamsNode = LcMemoryRedisChatV13NodeBase & {
  config: NodeConfig<LcMemoryRedisChatV13Params> & { credentials?: LcMemoryRedisChatV13Credentials };
};

export type LcMemoryRedisChatV13Node = LcMemoryRedisChatV13ParamsNode;