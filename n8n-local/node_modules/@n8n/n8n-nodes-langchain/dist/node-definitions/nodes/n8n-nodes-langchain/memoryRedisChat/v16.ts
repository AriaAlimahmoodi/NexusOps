/**
 * Redis Chat Memory Node - Version 1.6
 * Stores the chat history in Redis.
 */


export interface LcMemoryRedisChatV16Params {
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

export interface LcMemoryRedisChatV16Credentials {
  redis: CredentialReference;
}

interface LcMemoryRedisChatV16NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryRedisChat';
  version: 1.6;
}

export type LcMemoryRedisChatV16ParamsNode = LcMemoryRedisChatV16NodeBase & {
  config: NodeConfig<LcMemoryRedisChatV16Params> & { credentials?: LcMemoryRedisChatV16Credentials };
};

export type LcMemoryRedisChatV16Node = LcMemoryRedisChatV16ParamsNode;