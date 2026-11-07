/**
 * Chat Memory Manager Node - Version 1.1
 * Discriminator: mode=load
 */


/** Retrieve chat messages from connected memory */
export type LcMemoryManagerV11LoadParams = {
  mode: 'load';
/**
 * Whether to simplify the output to only include the sender and the text
 * @default true
 */
    simplifyOutput?: boolean | Expression<boolean>;
/**
 * Options
 * @default {}
 */
    options?: {
    /** Whether to group messages into a single item or return each message as a separate item
     * @default true
     */
    groupMessages?: boolean | Expression<boolean>;
  };
};

export interface LcMemoryManagerV11LoadSubnodeConfig {
  memory?: MemoryInstance;
}

export type LcMemoryManagerV11LoadNode = {
  type: '@n8n/n8n-nodes-langchain.memoryManager';
  version: 1.1;
  config: NodeConfig<LcMemoryManagerV11LoadParams> & { subnodes?: LcMemoryManagerV11LoadSubnodeConfig };
};