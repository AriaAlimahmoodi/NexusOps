/**
 * Xata Node - Version 1.3
 * Use Xata Memory
 */


export interface LcMemoryXataV13Params {
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
 * Context Window Length
 * @hint How many past interactions the model receives as context
 * @default 5
 */
    contextWindowLength?: number | Expression<number>;
}

export interface LcMemoryXataV13Credentials {
  xataApi: CredentialReference;
}

interface LcMemoryXataV13NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryXata';
  version: 1.3;
}

export type LcMemoryXataV13ParamsNode = LcMemoryXataV13NodeBase & {
  config: NodeConfig<LcMemoryXataV13Params> & { credentials?: LcMemoryXataV13Credentials };
};

export type LcMemoryXataV13Node = LcMemoryXataV13ParamsNode;