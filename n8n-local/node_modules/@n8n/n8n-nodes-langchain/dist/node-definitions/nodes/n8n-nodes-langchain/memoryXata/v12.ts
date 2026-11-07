/**
 * Xata Node - Version 1.2
 * Use Xata Memory
 */


export interface LcMemoryXataV12Params {
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
}

export interface LcMemoryXataV12Credentials {
  xataApi: CredentialReference;
}

interface LcMemoryXataV12NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryXata';
  version: 1.2;
}

export type LcMemoryXataV12ParamsNode = LcMemoryXataV12NodeBase & {
  config: NodeConfig<LcMemoryXataV12Params> & { credentials?: LcMemoryXataV12Credentials };
};

export type LcMemoryXataV12Node = LcMemoryXataV12ParamsNode;