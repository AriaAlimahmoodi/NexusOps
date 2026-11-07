/**
 * Vector Store Question Answer Tool Node - Version 1.1
 * Answer questions with a vector store
 */


export interface LcToolVectorStoreV11Params {
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

export interface LcToolVectorStoreV11SubnodeConfig {
  vectorStore: VectorStoreInstance;
  model: LanguageModelInstance | LanguageModelInstance[];
}

interface LcToolVectorStoreV11NodeBase {
  type: '@n8n/n8n-nodes-langchain.toolVectorStore';
  version: 1.1;
}

export type LcToolVectorStoreV11ParamsNode = LcToolVectorStoreV11NodeBase & {
  config: NodeConfig<LcToolVectorStoreV11Params> & { subnodes: LcToolVectorStoreV11SubnodeConfig };
};

export type LcToolVectorStoreV11Node = LcToolVectorStoreV11ParamsNode;