/**
 * Redis Chat Memory Node - Version 1.2
 * Stores the chat history in Redis.
 */


export interface LcMemoryRedisChatV12Params {
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
}

export interface LcMemoryRedisChatV12Credentials {
  redis: CredentialReference;
}

interface LcMemoryRedisChatV12NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryRedisChat';
  version: 1.2;
}

export type LcMemoryRedisChatV12ParamsNode = LcMemoryRedisChatV12NodeBase & {
  config: NodeConfig<LcMemoryRedisChatV12Params> & { credentials?: LcMemoryRedisChatV12Credentials };
};

export type LcMemoryRedisChatV12Node = LcMemoryRedisChatV12ParamsNode;