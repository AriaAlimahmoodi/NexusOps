/**
 * Xata Node - Version 1.1
 * Use Xata Memory
 */


export interface LcMemoryXataV11Params {
/**
 * The key to use to store the memory
 * @default ={{ $json.sessionId }}
 */
    sessionId?: string | Expression<string>;
/**
 * The key to use to store session ID in the memory
 * @displayOptions.show { sessionIdType: ["customKey"] }
 */
    sessionKey?: string | Expression<string>;
}

export interface LcMemoryXataV11Credentials {
  xataApi: CredentialReference;
}

interface LcMemoryXataV11NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryXata';
  version: 1.1;
}

export type LcMemoryXataV11ParamsNode = LcMemoryXataV11NodeBase & {
  config: NodeConfig<LcMemoryXataV11Params> & { credentials?: LcMemoryXataV11Credentials };
};

export type LcMemoryXataV11Node = LcMemoryXataV11ParamsNode;