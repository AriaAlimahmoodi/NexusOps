/**
 * Vector Store Question Answer Tool Node - Version 1
 * Answer questions with a vector store
 */


export interface LcToolVectorStoreV1Params {
/**
 * Name of the data in vector store. This will be used to fill this tool description: Useful for when you need to answer questions about [name]. Whenever you need information about [data description], you should ALWAYS use this. Input should be a fully formed question.
 */
    name?: string | Expression<string>;
/**
 * Describe the data in vector store. This will be used to fill this tool description: Useful for when you need to answer questions about [name]. Whenever you need information about [data description], you should ALWAYS use this. Input should be a fully formed question.
 */
    description?: string | Expression<string>;
/**
 * The maximum number of results to return
 * @default 4
 */
    topK?: number | Expression<number>;
}

export interface LcToolVectorStoreV1SubnodeConfig {
  vectorStore: VectorStoreInstance;
  model: LanguageModelInstance | LanguageModelInstance[];
}

interface LcToolVectorStoreV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.toolVectorStore';
  version: 1;
}

export type LcToolVectorStoreV1ParamsNode = LcToolVectorStoreV1NodeBase & {
  config: NodeConfig<LcToolVectorStoreV1Params> & { subnodes: LcToolVectorStoreV1SubnodeConfig };
};

export type LcToolVectorStoreV1Node = LcToolVectorStoreV1ParamsNode;