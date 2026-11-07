/**
 * Split In Batches Node - Version 2
 * Split data into batches and iterate over each batch
 */


export interface SplitInBatchesV2Params {
/**
 * The number of items to return with each call
 * @default 10
 */
    batchSize?: number | Expression<number>;
  options?: {
    /** Whether the node will be reset and so with the current input-data newly initialized
     * @default false
     */
    reset?: boolean | Expression<boolean>;
  };
}

interface SplitInBatchesV2NodeBase {
  type: 'n8n-nodes-base.splitInBatches';
  version: 2;
}

export type SplitInBatchesV2ParamsNode = SplitInBatchesV2NodeBase & {
  config: NodeConfig<SplitInBatchesV2Params>;
};

export type SplitInBatchesV2Node = SplitInBatchesV2ParamsNode;