/**
 * Vector Store Retriever Node - Version 1
 * Use a Vector Store as Retriever
 */


export interface LcRetrieverVectorStoreV1Params {
/**
 * The maximum number of results to return
 * @default 4
 */
    topK?: number | Expression<number>;
}

export interface LcRetrieverVectorStoreV1SubnodeConfig {
  vectorStore: VectorStoreInstance;
}

interface LcRetrieverVectorStoreV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.retrieverVectorStore';
  version: 1;
}

export type LcRetrieverVectorStoreV1ParamsNode = LcRetrieverVectorStoreV1NodeBase & {
  config: NodeConfig<LcRetrieverVectorStoreV1Params> & { subnodes: LcRetrieverVectorStoreV1SubnodeConfig };
};

export type LcRetrieverVectorStoreV1Node = LcRetrieverVectorStoreV1ParamsNode;