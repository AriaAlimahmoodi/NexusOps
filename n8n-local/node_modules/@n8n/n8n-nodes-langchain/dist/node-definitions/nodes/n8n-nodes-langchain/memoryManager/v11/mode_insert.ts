/**
 * Chat Memory Manager Node - Version 1.1
 * Discriminator: mode=insert
 */


/** Insert chat messages into connected memory */
export type LcMemoryManagerV11InsertParams = {
  mode: 'insert';
/**
 * Choose how new messages are inserted into the memory
 * @default insert
 */
    insertMode?: 'insert' | 'override';
/**
 * Chat messages to insert into memory
 * @default {}
 */
    messages?: {
        /** Message
     */
    messageValues?: Array<{
      /** Type Name or ID
       * @default system
       */
      type?: 'ai' | 'system' | 'user' | Expression<string>;
      /** Message
       */
      message?: string | Expression<string>;
      /** Whether to hide the message from the chat UI
       * @default false
       */
      hideFromUI?: boolean | Expression<boolean>;
    }>;
  };
};

export interface LcMemoryManagerV11InsertSubnodeConfig {
  memory?: MemoryInstance;
}

export type LcMemoryManagerV11InsertNode = {
  type: '@n8n/n8n-nodes-langchain.memoryManager';
  version: 1.1;
  config: NodeConfig<LcMemoryManagerV11InsertParams> & { subnodes?: LcMemoryManagerV11InsertSubnodeConfig };
};