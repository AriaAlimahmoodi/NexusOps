/**
 * Simple Memory Node - Version 1.2
 * Stores in n8n memory, so no credentials required
 */


export interface LcMemoryBufferWindowV12Params {
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

interface LcMemoryBufferWindowV12NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryBufferWindow';
  version: 1.2;
}

export type LcMemoryBufferWindowV12ParamsNode = LcMemoryBufferWindowV12NodeBase & {
  config: NodeConfig<LcMemoryBufferWindowV12Params>;
};

export type LcMemoryBufferWindowV12Node = LcMemoryBufferWindowV12ParamsNode;