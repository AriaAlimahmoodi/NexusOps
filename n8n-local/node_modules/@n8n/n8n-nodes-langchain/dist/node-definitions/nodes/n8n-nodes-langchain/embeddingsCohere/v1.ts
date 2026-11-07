/**
 * Embeddings Cohere Node - Version 1
 * Use Cohere Embeddings
 */


export interface LcEmbeddingsCohereV1Params {
/**
 * The model which will generate the embeddings. &lt;a href="https://docs.cohere.com/docs/models"&gt;Learn more&lt;/a&gt;.
 * @default embed-english-v2.0
 */
    modelName?: 'embed-english-light-v2.0' | 'embed-english-light-v3.0' | 'embed-english-v2.0' | 'embed-english-v3.0' | 'embed-multilingual-light-v3.0' | 'embed-multilingual-v2.0' | 'embed-multilingual-v3.0' | Expression<string>;
}

export interface LcEmbeddingsCohereV1Credentials {
  cohereApi: CredentialReference;
}

interface LcEmbeddingsCohereV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.embeddingsCohere';
  version: 1;
}

export type LcEmbeddingsCohereV1ParamsNode = LcEmbeddingsCohereV1NodeBase & {
  config: NodeConfig<LcEmbeddingsCohereV1Params> & { credentials?: LcEmbeddingsCohereV1Credentials };
};

export type LcEmbeddingsCohereV1Node = LcEmbeddingsCohereV1ParamsNode;