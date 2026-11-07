/**
 * Loop Over Items (Split in Batches) Node - Version 3
 * Split data into batches and iterate over each batch
 */


export interface SplitInBatchesV3Params {
/**
 * The number of items to return with each call
 * @default 1
 */
    batchSize?: number | Expression<number>;
  options?: {
    /** Whether the node starts again from the beginning of the input items. This will treat incoming data as a new set rather than continuing with the previous items.
     * @default false
     */
    reset?: boolean | Expression<boolean>;
  };
}

interface SplitInBatchesV3NodeBase {
  type: 'n8n-nodes-base.splitInBatches';
  version: 3;
}

export type SplitInBatchesV3ParamsNode = SplitInBatchesV3NodeBase & {
  config: NodeConfig<SplitInBatchesV3Params>;
};

export type SplitInBatchesV3Node = SplitInBatchesV3ParamsNode;