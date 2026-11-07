/**
 * Split In Batches Node - Version 1
 * Split data into batches and iterate over each batch
 */


export interface SplitInBatchesV1Params {
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

interface SplitInBatchesV1NodeBase {
  type: 'n8n-nodes-base.splitInBatches';
  version: 1;
}

export type SplitInBatchesV1ParamsNode = SplitInBatchesV1NodeBase & {
  config: NodeConfig<SplitInBatchesV1Params>;
};

export type SplitInBatchesV1Node = SplitInBatchesV1ParamsNode;