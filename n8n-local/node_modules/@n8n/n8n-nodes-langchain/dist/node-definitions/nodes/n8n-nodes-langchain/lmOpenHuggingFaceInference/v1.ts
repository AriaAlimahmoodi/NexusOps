/**
 * Hugging Face Inference Model Node - Version 1
 * Language Model HuggingFaceInference
 */


export interface LcLmOpenHuggingFaceInferenceV1Params {
  model?: string | Expression<string>;
/**
 * Additional options to add
 * @default {}
 */
    options?: {
    /** Custom endpoint URL
     */
    endpointUrl?: string | Expression<string>;
    /** Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim
     * @default 0
     */
    frequencyPenalty?: number | Expression<number>;
    /** The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 32,768).
     * @default 128
     */
    maxTokens?: number | Expression<number>;
    /** Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics
     * @default 0
     */
    presencePenalty?: number | Expression<number>;
    /** Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.
     * @default 1
     */
    temperature?: number | Expression<number>;
    /** Controls the top tokens to consider within the sample operation to create new text
     * @default 1
     */
    topK?: number | Expression<number>;
    /** Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. We generally recommend altering this or temperature but not both.
     * @default 1
     */
    topP?: number | Expression<number>;
  };
}

export interface LcLmOpenHuggingFaceInferenceV1Credentials {
  huggingFaceApi: CredentialReference;
}

interface LcLmOpenHuggingFaceInferenceV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.lmOpenHuggingFaceInference';
  version: 1;
}

export type LcLmOpenHuggingFaceInferenceV1ParamsNode = LcLmOpenHuggingFaceInferenceV1NodeBase & {
  config: NodeConfig<LcLmOpenHuggingFaceInferenceV1Params> & { credentials?: LcLmOpenHuggingFaceInferenceV1Credentials };
};

export type LcLmOpenHuggingFaceInferenceV1Node = LcLmOpenHuggingFaceInferenceV1ParamsNode;