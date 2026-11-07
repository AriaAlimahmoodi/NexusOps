/**
 * Merge Node - Version 1
 * Discriminator: mode=wait
 */


/** Waits till data of both inputs is available and will then output a single empty item. Source Nodes must connect to both Input 1 and 2. This node only supports 2 Sources, if you need more Sources, connect multiple Merge nodes in series. This node will not output any data. */
export type MergeV1WaitParams = {
  mode: 'wait';
};

export type MergeV1WaitNode = {
  type: 'n8n-nodes-base.merge';
  version: 1;
  config: NodeConfig<MergeV1WaitParams>;
};