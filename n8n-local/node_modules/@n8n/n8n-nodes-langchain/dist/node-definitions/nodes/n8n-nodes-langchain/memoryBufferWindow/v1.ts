/**
 * Simple Memory Node - Version 1
 * Stores in n8n memory, so no credentials required
 */


export interface LcMemoryBufferWindowV1Params {
/**
 * The key to use to store the memory in the workflow data
 * @default chat_history
 */
    sessionKey?: string | Expression<string>;
/**
 * Context Window Length
 * @hint How many past interactions the model receives as context
 * @default 5
 */
    contextWindowLength?: number | Expression<number>;
}

interface LcMemoryBufferWindowV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryBufferWindow';
  version: 1;
}

export type LcMemoryBufferWindowV1ParamsNode = LcMemoryBufferWindowV1NodeBase & {
  config: NodeConfig<LcMemoryBufferWindowV1Params>;
};

export type LcMemoryBufferWindowV1Node = LcMemoryBufferWindowV1ParamsNode;