/**
 * Xata Node - Version 1.4
 * Use Xata Memory
 */


export interface LcMemoryXataV14Params {
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

export interface LcMemoryXataV14Credentials {
  xataApi: CredentialReference;
}

interface LcMemoryXataV14NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryXata';
  version: 1.4;
}

export type LcMemoryXataV14ParamsNode = LcMemoryXataV14NodeBase & {
  config: NodeConfig<LcMemoryXataV14Params> & { credentials?: LcMemoryXataV14Credentials };
};

export type LcMemoryXataV14Node = LcMemoryXataV14ParamsNode;