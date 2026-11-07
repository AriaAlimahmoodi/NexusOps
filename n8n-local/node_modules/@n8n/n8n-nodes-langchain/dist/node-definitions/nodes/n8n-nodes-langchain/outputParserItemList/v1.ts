/**
 * Item List Output Parser Node - Version 1
 * Return the results as separate items
 */


export interface LcOutputParserItemListV1Params {
  options?: {
    /** Defines how many items should be returned maximally. If set to -1, there is no limit.
     * @default -1
     */
    numberOfItems?: number | Expression<number>;
    /** Defines the separator that should be used to split the results into separate items. Defaults to a new line but can be changed depending on the data that should be returned.
     * @default \n
     */
    separator?: string | Expression<string>;
  };
}

interface LcOutputParserItemListV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.outputParserItemList';
  version: 1;
}

export type LcOutputParserItemListV1ParamsNode = LcOutputParserItemListV1NodeBase & {
  config: NodeConfig<LcOutputParserItemListV1Params>;
};

export type LcOutputParserItemListV1Node = LcOutputParserItemListV1ParamsNode;