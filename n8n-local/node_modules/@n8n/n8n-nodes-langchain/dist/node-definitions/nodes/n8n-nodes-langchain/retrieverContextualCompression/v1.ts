/**
 * Contextual Compression Retriever Node - Version 1
 * Enhances document similarity search by contextual compression.
 */


export interface LcRetrieverContextualCompressionV1Params {
}

export interface LcRetrieverContextualCompressionV1SubnodeConfig {
  model: LanguageModelInstance | LanguageModelInstance[];
  retriever: RetrieverInstance;
}

interface LcRetrieverContextualCompressionV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.retrieverContextualCompression';
  version: 1;
}

export type LcRetrieverContextualCompressionV1ParamsNode = LcRetrieverContextualCompressionV1NodeBase & {
  config: NodeConfig<LcRetrieverContextualCompressionV1Params> & { subnodes: LcRetrieverContextualCompressionV1SubnodeConfig };
};

export type LcRetrieverContextualCompressionV1Node = LcRetrieverContextualCompressionV1ParamsNode;