/**
 * Redis Chat Memory Node - Version 1
 * Stores the chat history in Redis.
 */


export interface LcMemoryRedisChatV1Params {
/**
 * The key to use to store the memory in the workflow data
 * @default chat_history
 */
    sessionKey?: string | Expression<string>;
/**
 * For how long the session should be stored in seconds. If set to 0 it will not expire.
 * @default 0
 */
    sessionTTL?: number | Expression<number>;
}

export interface LcMemoryRedisChatV1Credentials {
  redis: CredentialReference;
}

interface LcMemoryRedisChatV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryRedisChat';
  version: 1;
}

export type LcMemoryRedisChatV1ParamsNode = LcMemoryRedisChatV1NodeBase & {
  config: NodeConfig<LcMemoryRedisChatV1Params> & { credentials?: LcMemoryRedisChatV1Credentials };
};

export type LcMemoryRedisChatV1Node = LcMemoryRedisChatV1ParamsNode;