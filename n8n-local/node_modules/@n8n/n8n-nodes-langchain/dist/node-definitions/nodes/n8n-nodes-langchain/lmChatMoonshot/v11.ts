/**
 * Moonshot Kimi Chat Model Node - Version 1.1
 * For advanced usage with an AI chain
 */


export interface LcLmChatMoonshotV11Params {
/**
 * The model which will generate the completion. &lt;a href="https://platform.kimi.ai/docs/api/chat"&gt;Learn more&lt;/a&gt;.
 * @default kimi-k2.6
 */
    model?: string | Expression<string>;
/**
 * Additional options to add
 * @default {}
 */
    options?: {
    /** Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim
     * @default 0
     */
    frequencyPenalty?: number | Expression<number>;
    /** The maximum number of tokens to generate in the completion. The limit depends on the selected model.
     * @default -1
     */
    maxTokens?: number | Expression<number>;
    /** Response Format
     * @default text
     */
    responseFormat?: 'text' | 'json_object' | Expression<string>;
    /** Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics
     * @default 0
     */
    presencePenalty?: number | Expression<number>;
    /** Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.
     * @default 0.7
     */
    temperature?: number | Expression<number>;
    /** Maximum amount of time a request is allowed to take in milliseconds
     * @default 360000
     */
    timeout?: number | Expression<number>;
    /** Maximum number of retries to attempt
     * @default 2
     */
    maxRetries?: number | Expression<number>;
    /** Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. We generally recommend altering this or temperature but not both.
     * @default 1
     */
    topP?: number | Expression<number>;
  };
}

export interface LcLmChatMoonshotV11Credentials {
  moonshotApi: CredentialReference;
}

interface LcLmChatMoonshotV11NodeBase {
  type: '@n8n/n8n-nodes-langchain.lmChatMoonshot';
  version: 1.1;
}

export type LcLmChatMoonshotV11ParamsNode = LcLmChatMoonshotV11NodeBase & {
  config: NodeConfig<LcLmChatMoonshotV11Params> & { credentials?: LcLmChatMoonshotV11Credentials };
};

export type LcLmChatMoonshotV11Node = LcLmChatMoonshotV11ParamsNode;