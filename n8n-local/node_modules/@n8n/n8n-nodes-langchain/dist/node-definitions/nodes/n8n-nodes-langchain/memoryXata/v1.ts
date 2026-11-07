/**
 * Xata Node - Version 1
 * Use Xata Memory
 */


export interface LcMemoryXataV1Params {
/**
 * Session ID
 */
    sessionId: string | Expression<string>;
/**
 * The key to use to store session ID in the memory
 * @displayOptions.show { sessionIdType: ["customKey"] }
 */
    sessionKey?: string | Expression<string>;
}

export interface LcMemoryXataV1Credentials {
  xataApi: CredentialReference;
}

interface LcMemoryXataV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryXata';
  version: 1;
}

export type LcMemoryXataV1ParamsNode = LcMemoryXataV1NodeBase & {
  config: NodeConfig<LcMemoryXataV1Params> & { credentials?: LcMemoryXataV1Credentials };
};

export type LcMemoryXataV1Node = LcMemoryXataV1ParamsNode;