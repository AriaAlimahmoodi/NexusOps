/**
 * Chat Memory Manager Node - Version 1.1
 * Discriminator: mode=delete
 */


/** Delete chat messages from connected memory */
export type LcMemoryManagerV11DeleteParams = {
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

export interface LcMemoryManagerV11DeleteSubnodeConfig {
  memory?: MemoryInstance;
}

export type LcMemoryManagerV11DeleteNode = {
  type: '@n8n/n8n-nodes-langchain.memoryManager';
  version: 1.1;
  config: NodeConfig<LcMemoryManagerV11DeleteParams> & { subnodes?: LcMemoryManagerV11DeleteSubnodeConfig };
};