/**
 * Chat Memory Manager Node - Version 1
 * Discriminator: mode=delete
 */


/** Delete chat messages from connected memory */
export type LcMemoryManagerV1DeleteParams = {
  mode: 'delete';
/**
 * How messages are deleted from memory
 * @default lastN
 */
    deleteMode?: 'lastN' | 'all';
/**
 * The amount of last messages to delete
 * @displayOptions.show { deleteMode: ["lastN"] }
 * @default 2
 */
    lastMessagesCount?: number | Expression<number>;
};

export interface LcMemoryManagerV1DeleteSubnodeConfig {
  memory?: MemoryInstance;
}

export type LcMemoryManagerV1DeleteNode = {
  type: '@n8n/n8n-nodes-langchain.memoryManager';
  version: 1;
  config: NodeConfig<LcMemoryManagerV1DeleteParams> & { subnodes?: LcMemoryManagerV1DeleteSubnodeConfig };
};