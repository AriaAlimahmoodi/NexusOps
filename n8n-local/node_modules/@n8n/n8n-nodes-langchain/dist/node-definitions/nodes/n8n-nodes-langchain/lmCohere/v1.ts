/**
 * Cohere Model Node - Version 1
 * Language Model Cohere
 */


export interface LcLmCohereV1Params {
/**
 * Additional options to add
 * @default {}
 */
    options?: {
    /** The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 32,768).
     * @default 250
     */
    maxTokens?: number | Expression<number>;
    /** The name of the model to use
     */
    model?: string | Expression<string>;
    /** Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.
     * @default 0
     */
    temperature?: number | Expression<number>;
  };
}

export interface LcLmCohereV1Credentials {
  cohereApi: CredentialReference;
}

interface LcLmCohereV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.lmCohere';
  version: 1;
}

export type LcLmCohereV1ParamsNode = LcLmCohereV1NodeBase & {
  config: NodeConfig<LcLmCohereV1Params> & { credentials?: LcLmCohereV1Credentials };
};

export type LcLmCohereV1Node = LcLmCohereV1ParamsNode;