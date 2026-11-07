/**
 * Xata Node - Version 1.5
 * Use Xata Memory
 */


export interface LcMemoryXataV15Params {
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

export interface LcMemoryXataV15Credentials {
  xataApi: CredentialReference;
}

interface LcMemoryXataV15NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryXata';
  version: 1.5;
}

export type LcMemoryXataV15ParamsNode = LcMemoryXataV15NodeBase & {
  config: NodeConfig<LcMemoryXataV15Params> & { credentials?: LcMemoryXataV15Credentials };
};

export type LcMemoryXataV15Node = LcMemoryXataV15ParamsNode;