/**
 * Reranker Cohere Node - Version 1
 * Use Cohere Reranker to reorder documents after retrieval from a vector store by relevance to the given query.
 */


export interface LcRerankerCohereV1Params {
/**
 * The model that should be used to rerank the documents. &lt;a href="https://docs.cohere.com/docs/models"&gt;Learn more&lt;/a&gt;.
 * @default rerank-v3.5
 */
    modelName?: 'rerank-v3.5' | 'rerank-english-v3.0' | 'rerank-multilingual-v3.0' | Expression<string>;
/**
 * The maximum number of documents to return after reranking
 * @default 3
 */
    topN?: number | Expression<number>;
}

export interface LcRerankerCohereV1Credentials {
  cohereApi: CredentialReference;
}

interface LcRerankerCohereV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.rerankerCohere';
  version: 1;
}

export type LcRerankerCohereV1ParamsNode = LcRerankerCohereV1NodeBase & {
  config: NodeConfig<LcRerankerCohereV1Params> & { credentials?: LcRerankerCohereV1Credentials };
};

export type LcRerankerCohereV1Node = LcRerankerCohereV1ParamsNode;