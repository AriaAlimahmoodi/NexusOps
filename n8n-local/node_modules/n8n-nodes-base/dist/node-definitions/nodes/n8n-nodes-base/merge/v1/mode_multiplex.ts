/**
 * Merge Node - Version 1
 * Discriminator: mode=multiplex
 */


/** Merges each value of one input with each value of the other input. The output will contain (m * n) items where (m) and (n) are lengths of the inputs. */
export type MergeV1MultiplexParams = {
  mode: 'multiplex';
};

export type MergeV1MultiplexNode = {
  type: 'n8n-nodes-base.merge';
  version: 1;
  config: NodeConfig<MergeV1MultiplexParams>;
};