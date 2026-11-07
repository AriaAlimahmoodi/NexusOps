/**
 * Merge Node - Version 2
 * Discriminator: mode=append
 */


/** All items of input 1, then all items of input 2 */
export type MergeV2AppendParams = {
  mode: 'append';
};

export type MergeV2AppendNode = {
  type: 'n8n-nodes-base.merge';
  version: 2;
  config: NodeConfig<MergeV2AppendParams>;
};