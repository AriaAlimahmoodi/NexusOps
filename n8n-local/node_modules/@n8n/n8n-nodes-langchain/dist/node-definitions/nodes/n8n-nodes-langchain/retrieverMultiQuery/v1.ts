/**
 * MultiQuery Retriever Node - Version 1
 * Automates prompt tuning, generates diverse queries and expands document pool for enhanced retrieval.
 */


export interface LcRetrieverMultiQueryV1Params {
/**
 * Additional options to add
 * @default {}
 */
    options?: {
    /** Number of different versions of the given question to generate
     * @default 3
     */
    queryCount?: number | Expression<number>;
  };
}

export interface LcRetrieverMultiQueryV1SubnodeConfig {
  model: LanguageModelInstance | LanguageModelInstance[];
  retriever: RetrieverInstance;
}

interface LcRetrieverMultiQueryV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.retrieverMultiQuery';
  version: 1;
}

export type LcRetrieverMultiQueryV1ParamsNode = LcRetrieverMultiQueryV1NodeBase & {
  config: NodeConfig<LcRetrieverMultiQueryV1Params> & { subnodes: LcRetrieverMultiQueryV1SubnodeConfig };
};

export type LcRetrieverMultiQueryV1Node = LcRetrieverMultiQueryV1ParamsNode;