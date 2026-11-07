/**
 * Merge Node - Version 2.1
 * Discriminator: mode=append
 */


/** All items of input 1, then all items of input 2 */
export type MergeV21AppendParams = {
  mode: 'append';
};

export type MergeV21AppendNode = {
  type: 'n8n-nodes-base.merge';
  version: 2.1;
  config: NodeConfig<MergeV21AppendParams>;
};