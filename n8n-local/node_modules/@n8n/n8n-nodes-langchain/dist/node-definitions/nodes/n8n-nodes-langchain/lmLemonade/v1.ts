/**
 * Lemonade Model Node - Version 1
 * Language Model Lemonade
 */


export interface LcLmLemonadeV1Params {
/**
 * The model which will generate the completion. Models are loaded and managed through the Lemonade server.
 */
    model: string | Expression<string>;
/**
 * Additional options to add
 * @default {}
 */
    options?: {
    /** Controls the randomness of the generated text. Lower values make the output more focused and deterministic, while higher values make it more diverse and random.
     * @default 0.7
     */
    temperature?: number | Expression<number>;
    /** Chooses from the smallest possible set of tokens whose cumulative probability exceeds the probability top_p. Helps generate more human-like text by reducing repetitions.
     * @default 1
     */
    topP?: number | Expression<number>;
    /** Adjusts the penalty for tokens that have already appeared in the generated text. Positive values discourage repetition, negative values encourage it.
     * @default 0
     */
    frequencyPenalty?: number | Expression<number>;
    /** Adjusts the penalty for tokens based on their presence in the generated text so far. Positive values penalize tokens that have already appeared, encouraging diversity.
     * @default 0
     */
    presencePenalty?: number | Expression<number>;
    /** The maximum number of tokens to generate. Set to -1 for no limit. Be cautious when setting this to a large value, as it can lead to very long outputs.
     * @default -1
     */
    maxTokens?: number | Expression<number>;
    /** Comma-separated list of sequences where the model will stop generating text
     */
    stop?: string | Expression<string>;
  };
}

export interface LcLmLemonadeV1Credentials {
  lemonadeApi: CredentialReference;
}

interface LcLmLemonadeV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.lmLemonade';
  version: 1;
}

export type LcLmLemonadeV1ParamsNode = LcLmLemonadeV1NodeBase & {
  config: NodeConfig<LcLmLemonadeV1Params> & { credentials?: LcLmLemonadeV1Credentials };
};

export type LcLmLemonadeV1Node = LcLmLemonadeV1ParamsNode;