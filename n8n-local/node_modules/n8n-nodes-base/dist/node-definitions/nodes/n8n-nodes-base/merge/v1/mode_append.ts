/**
 * Merge Node - Version 1
 * Discriminator: mode=append
 */


/** Combines data of both inputs. The output will contain items of input 1 and input 2. */
export type MergeV1AppendParams = {
  mode: 'append';
};

export type MergeV1AppendNode = {
  type: 'n8n-nodes-base.merge';
  version: 1;
  config: NodeConfig<MergeV1AppendParams>;
};