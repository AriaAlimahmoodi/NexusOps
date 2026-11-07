/**
 * Embeddings Hugging Face Inference Node - Version 1
 * Use HuggingFace Inference Embeddings
 */


export interface LcEmbeddingsHuggingFaceInferenceV1Params {
/**
 * The model name to use from HuggingFace library
 * @default sentence-transformers/distilbert-base-nli-mean-tokens
 */
    modelName?: string | Expression<string>;
/**
 * Additional options to add
 * @default {}
 */
    options?: {
    /** Custom endpoint URL
     */
    endpointUrl?: string | Expression<string>;
    /** Provider
     * @default auto
     */
    provider?: 'black-forest-labs' | 'cerebras' | 'cohere' | 'fal-ai' | 'featherless-ai' | 'fireworks-ai' | 'groq' | 'hf-inference' | 'hyperbolic' | 'nebius' | 'novita' | 'nscale' | 'openai' | 'ovhcloud' | 'replicate' | 'sambanova' | 'together' | 'auto' | Expression<string>;
  };
}

export interface LcEmbeddingsHuggingFaceInferenceV1Credentials {
  huggingFaceApi: CredentialReference;
}

interface LcEmbeddingsHuggingFaceInferenceV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.embeddingsHuggingFaceInference';
  version: 1;
}

export type LcEmbeddingsHuggingFaceInferenceV1ParamsNode = LcEmbeddingsHuggingFaceInferenceV1NodeBase & {
  config: NodeConfig<LcEmbeddingsHuggingFaceInferenceV1Params> & { credentials?: LcEmbeddingsHuggingFaceInferenceV1Credentials };
};

export type LcEmbeddingsHuggingFaceInferenceV1Node = LcEmbeddingsHuggingFaceInferenceV1ParamsNode;