/**
 * Merge Node - Version 1
 * Discriminator: mode=passThrough
 */


/** Passes through data of one input. The output will contain only items of the defined input. */
export type MergeV1PassThroughParams = {
  mode: 'passThrough';
/**
 * Defines of which input the data should be used as output of node
 * @default input1
 */
    output?: 'input1' | 'input2' | Expression<string>;
};

export type MergeV1PassThroughNode = {
  type: 'n8n-nodes-base.merge';
  version: 1;
  config: NodeConfig<MergeV1PassThroughParams>;
};