/**
 * Redis Chat Memory Node - Version 1.1
 * Stores the chat history in Redis.
 */


export interface LcMemoryRedisChatV11Params {
/**
 * The key to use to store the memory
 * @default ={{ $json.sessionId }}
 */
    sessionKey?: string | Expression<string>;
/**
 * For how long the session should be stored in seconds. If set to 0 it will not expire.
 * @default 0
 */
    sessionTTL?: number | Expression<number>;
}

export interface LcMemoryRedisChatV11Credentials {
  redis: CredentialReference;
}

interface LcMemoryRedisChatV11NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryRedisChat';
  version: 1.1;
}

export type LcMemoryRedisChatV11ParamsNode = LcMemoryRedisChatV11NodeBase & {
  config: NodeConfig<LcMemoryRedisChatV11Params> & { credentials?: LcMemoryRedisChatV11Credentials };
};

export type LcMemoryRedisChatV11Node = LcMemoryRedisChatV11ParamsNode;