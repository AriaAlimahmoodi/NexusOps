/**
 * Moonshot Kimi Node - Version 1
 * Discriminator: resource=text, operation=message
 */


interface Credentials {
  moonshotApi: CredentialReference;
}

/** Send a message and get a response from a Moonshot Kimi model */
export type LcMoonshotV1TextMessageParams = {
  resource: 'text';
  operation: 'message';
/**
 * Model
 * @searchListMethod modelSearch
 * @default {"mode":"list","value":""}
 */
    modelId?: { __rl: true; mode: 'list' | 'id'; value: string; cachedResultName?: string };
/**
 * Messages
 * @default {"values":[{"content":"","role":"user"}]}
 */
    messages?: {
        /** Values
     */
    values?: Array<{
      /** The content of the message to be sent
       */
      content?: string | Expression<string>;
      /** Role in shaping the model's response, it tells the model how it should behave and interact with the user
       * @default user
       */
      role?: 'user' | 'assistant' | Expression<string>;
    }>;
  };
/**
 * Whether to add image attachments to the message
 * @default false
 */
    addAttachments?: boolean | Expression<boolean>;
/**
 * Name of the binary field(s) which contains the image(s) to attach, separate multiple field names with commas
 * @displayOptions.show { addAttachments: [true] }
 * @default data
 */
    binaryPropertyName?: string | Expression<string>;
/**
 * Whether to return a simplified version of the response instead of the raw data
 * @default true
 */
    simplify?: boolean | Expression<boolean>;
/**
 * Options
 * @default {}
 */
    options?: {
    /** Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim
     * @default 0
     */
    frequencyPenalty?: number | Expression<number>;
    /** Whether to include a single output string merging all text parts of the response
     * @default false
     */
    includeMergedResponse?: boolean | Expression<boolean>;
    /** The maximum number of tokens to generate in the completion
     * @default 1024
     */
    maxTokens?: number | Expression<number>;
    /** The maximum number of tool iteration cycles the LLM will run before stopping. A single iteration can contain multiple tool calls. Set to 0 for no limit.
     * @default 15
     */
    maxToolsIterations?: number | Expression<number>;
    /** Controls the randomness of the output. Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.
     * @default 0.7
     */
    temperature?: number | Expression<number>;
    /** The maximum cumulative probability of tokens to consider when sampling
     * @default 1
     */
    topP?: number | Expression<number>;
    /** Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics
     * @default 0
     */
    presencePenalty?: number | Expression<number>;
    /** Response Format
     * @default text
     */
    responseFormat?: 'text' | 'json_object' | Expression<string>;
    /** System Message
     */
    system?: string | Expression<string>;
    /** Whether to enable thinking mode for deep reasoning. The model will include reasoning steps in the response. Cannot be used together with Web Search.
     * @default false
     */
    thinkingMode?: boolean | Expression<boolean>;
    /** Whether to enable built-in web search. The model will search the web for relevant information. Cannot be used together with Thinking Mode.
     * @default false
     */
    webSearch?: boolean | Expression<boolean>;
  };
};

export interface LcMoonshotV1TextMessageSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcMoonshotV1TextMessageNode = {
  type: '@n8n/n8n-nodes-langchain.moonshot';
  version: 1;
  isTrigger: true;
  config: NodeConfig<LcMoonshotV1TextMessageParams> & { credentials?: Credentials } & { subnodes?: LcMoonshotV1TextMessageSubnodeConfig };
};