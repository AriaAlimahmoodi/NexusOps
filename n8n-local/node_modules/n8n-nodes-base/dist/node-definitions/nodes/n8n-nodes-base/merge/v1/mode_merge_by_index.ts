/**
 * Merge Node - Version 1
 * Discriminator: mode=mergeByIndex
 */


/** Merges data of both inputs. The output will contain items of input 1 merged with data of input 2. Merge happens depending on the index of the items. So first item of input 1 will be merged with first item of input 2 and so on. */
export type MergeV1MergeByIndexParams = {
  mode: 'mergeByIndex';
/**
 * How many items the output will contain if inputs contain different amount of items
 * @default left
 */
    join?: 'inner' | 'left' | 'outer' | Expression<string>;
};

export type MergeV1MergeByIndexNode = {
  type: 'n8n-nodes-base.merge';
  version: 1;
  config: NodeConfig<MergeV1MergeByIndexParams>;
};