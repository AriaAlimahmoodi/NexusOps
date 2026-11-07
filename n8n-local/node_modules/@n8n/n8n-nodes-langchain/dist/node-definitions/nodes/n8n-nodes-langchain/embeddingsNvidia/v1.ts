/**
 * NVIDIA Nemotron Embeddings Node - Version 1
 * Use NVIDIA NeMo Retriever embedding models from build.nvidia.com or a self-hosted NIM
 */


export interface LcEmbeddingsNvidiaV1Params {
/**
 * The NeMo Retriever embedding model. Choose from the list, or specify an ID for a self-hosted NIM. input_type is set automatically (passage when indexing, query when searching). &lt;a href="https://build.nvidia.com/models"&gt;Learn more&lt;/a&gt;.
 * @searchListMethod searchModels
 * @default {"mode":"list","value":"nvidia/llama-3.2-nv-embedqa-1b-v2"}
 */
    model?: { __rl: true; mode: 'list' | 'id'; value: string; cachedResultName?: string };
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
    /** The number of dimensions the resulting output embeddings should have. Only supported by models with dynamic (Matryoshka) embeddings; leave unset to use the model default.
     */
    dimensions?: number | Expression<number>;
    /** Maximum amount of time a request is allowed to take in seconds. Set to -1 for no timeout.
     * @default -1
     */
    timeout?: number | Expression<number>;
  };
}

export interface LcEmbeddingsNvidiaV1Credentials {
  nvidiaApi: CredentialReference;
}

interface LcEmbeddingsNvidiaV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.embeddingsNvidia';
  version: 1;
}

export type LcEmbeddingsNvidiaV1ParamsNode = LcEmbeddingsNvidiaV1NodeBase & {
  config: NodeConfig<LcEmbeddingsNvidiaV1Params> & { credentials?: LcEmbeddingsNvidiaV1Credentials };
};

export type LcEmbeddingsNvidiaV1Node = LcEmbeddingsNvidiaV1ParamsNode;