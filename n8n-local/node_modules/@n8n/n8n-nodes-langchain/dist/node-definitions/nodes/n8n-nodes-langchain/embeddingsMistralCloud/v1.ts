/**
 * Embeddings Mistral Cloud Node - Version 1
 * Use Embeddings Mistral Cloud
 */


export interface LcEmbeddingsMistralCloudV1Params {
/**
 * The model which will compute the embeddings. &lt;a href="https://docs.mistral.ai/platform/endpoints/"&gt;Learn more&lt;/a&gt;.
 * @default mistral-embed
 */
    model?: string | Expression<string>;
/**
 * Additional options to add
 * @default {}
 */
    options?: {
    /** Maximum number of documents to send in each request
     * @default 512
     */
    batchSize?: number | Expression<number>;
    /** Whether to strip new lines from the input text
     * @default true
     */
    stripNewLines?: boolean | Expression<boolean>;
  };
}

export interface LcEmbeddingsMistralCloudV1Credentials {
  mistralCloudApi: CredentialReference;
}

interface LcEmbeddingsMistralCloudV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.embeddingsMistralCloud';
  version: 1;
}

export type LcEmbeddingsMistralCloudV1ParamsNode = LcEmbeddingsMistralCloudV1NodeBase & {
  config: NodeConfig<LcEmbeddingsMistralCloudV1Params> & { credentials?: LcEmbeddingsMistralCloudV1Credentials };
};

export type LcEmbeddingsMistralCloudV1Node = LcEmbeddingsMistralCloudV1ParamsNode;