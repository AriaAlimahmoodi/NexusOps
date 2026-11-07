/**
 * Simple Memory Node - Version 1.1
 * Stores in n8n memory, so no credentials required
 */


export interface LcMemoryBufferWindowV11Params {
/**
 * The key to use to store the memory
 * @default ={{ $json.sessionId }}
 */
    sessionKey?: string | Expression<string>;
/**
 * Context Window Length
 * @hint How many past interactions the model receives as context
 * @default 5
 */
    contextWindowLength?: number | Expression<number>;
}

interface LcMemoryBufferWindowV11NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryBufferWindow';
  version: 1.1;
}

export type LcMemoryBufferWindowV11ParamsNode = LcMemoryBufferWindowV11NodeBase & {
  config: NodeConfig<LcMemoryBufferWindowV11Params>;
};

export type LcMemoryBufferWindowV11Node = LcMemoryBufferWindowV11ParamsNode;