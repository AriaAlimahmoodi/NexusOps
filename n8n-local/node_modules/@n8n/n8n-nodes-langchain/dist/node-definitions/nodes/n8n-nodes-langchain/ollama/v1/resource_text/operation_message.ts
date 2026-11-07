/**
 * Ollama Node - Version 1
 * Discriminator: resource=text, operation=message
 */


interface Credentials {
  ollamaApi: CredentialReference;
}

/** Send a message to Ollama model */
export type LcOllamaV1TextMessageParams = {
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
      /** The role of this message in the conversation
       * @default user
       */
      role?: 'user' | 'assistant' | Expression<string>;
    }>;
  };
/**
 * Whether to simplify the response or not
 * @default true
 */
    simplify?: boolean | Expression<boolean>;
/**
 * Options
 * @default {}
 */
    options?: {
    /** System message to set the context for the conversation
     */
    system?: string | Expression<string>;
    /** Controls randomness in responses. Lower values make output more focused.
     * @default 0.8
     */
    temperature?: number | Expression<number>;
    /** Whether to enable (default) thinking mode for supported models. When enabled, the model's thinking process is separated from the output. When disabled, the model outputs content directly (only for supported models).
     * @default true
     */
    think?: boolean | Expression<boolean>;
    /** The maximum cumulative probability of tokens to consider when sampling
     * @default 0.7
     */
    top_p?: number | Expression<number>;
    /** Controls diversity by limiting the number of top tokens to consider
     * @default 40
     */
    top_k?: number | Expression<number>;
    /** Maximum number of tokens to generate in the completion
     * @default 1024
     */
    num_predict?: number | Expression<number>;
    /** Adjusts the penalty for tokens that have already appeared in the generated text. Higher values discourage repetition.
     * @default 0
     */
    frequency_penalty?: number | Expression<number>;
    /** Adjusts the penalty for tokens based on their presence in the generated text so far. Positive values penalize tokens that have already appeared, encouraging diversity.
     * @default 0
     */
    presence_penalty?: number | Expression<number>;
    /** Sets how strongly to penalize repetitions. A higher value (e.g., 1.5) will penalize repetitions more strongly, while a lower value (e.g., 0.9) will be more lenient.
     * @default 1.1
     */
    repeat_penalty?: number | Expression<number>;
    /** Sets the size of the context window used to generate the next token
     * @default 4096
     */
    num_ctx?: number | Expression<number>;
    /** Sets how far back for the model to look back to prevent repetition. (0 = disabled, -1 = num_ctx).
     * @default 64
     */
    repeat_last_n?: number | Expression<number>;
    /** Alternative to the top_p, and aims to ensure a balance of quality and variety. The parameter p represents the minimum probability for a token to be considered, relative to the probability of the most likely token.
     * @default 0
     */
    min_p?: number | Expression<number>;
    /** Sets the random number seed to use for generation. Setting this to a specific number will make the model generate the same text for the same prompt.
     * @default 0
     */
    seed?: number | Expression<number>;
    /** Sets the stop sequences to use. When this pattern is encountered the LLM will stop generating text and return. Separate multiple patterns with commas
     */
    stop?: string | Expression<string>;
    /** Specifies the duration to keep the loaded model in memory after use. Format: 1h30m (1 hour 30 minutes).
     * @default 5m
     */
    keep_alive?: string | Expression<string>;
    /** Whether to activate low VRAM mode, which reduces memory usage at the cost of slower generation speed. Useful for GPUs with limited memory.
     * @default false
     */
    low_vram?: boolean | Expression<boolean>;
    /** Specifies the ID of the GPU to use for the main computation. Only change this if you have multiple GPUs.
     * @default 0
     */
    main_gpu?: number | Expression<number>;
    /** Sets the batch size for prompt processing. Larger batch sizes may improve generation speed but increase memory usage.
     * @default 512
     */
    num_batch?: number | Expression<number>;
    /** Specifies the number of GPUs to use for parallel processing. Set to -1 for auto-detection.
     * @default -1
     */
    num_gpu?: number | Expression<number>;
    /** Specifies the number of CPU threads to use for processing. Set to 0 for auto-detection.
     * @default 0
     */
    num_thread?: number | Expression<number>;
    /** Whether the model will be less likely to generate newline characters, encouraging longer continuous sequences of text
     * @default true
     */
    penalize_newline?: boolean | Expression<boolean>;
    /** Whether to lock the model in memory to prevent swapping. This can improve performance but requires sufficient available memory.
     * @default false
     */
    use_mlock?: boolean | Expression<boolean>;
    /** Whether to use memory mapping for loading the model. This can reduce memory usage but may impact performance.
     * @default true
     */
    use_mmap?: boolean | Expression<boolean>;
    /** Whether to only load the model vocabulary without the weights. Useful for quickly testing tokenization.
     * @default false
     */
    vocab_only?: boolean | Expression<boolean>;
    /** Specifies the format of the API response
     */
    format?: '' | 'json' | Expression<string>;
  };
};

export interface LcOllamaV1TextMessageSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcOllamaV1TextMessageNode = {
  type: '@n8n/n8n-nodes-langchain.ollama';
  version: 1;
  isTrigger: true;
  config: NodeConfig<LcOllamaV1TextMessageParams> & { credentials?: Credentials } & { subnodes?: LcOllamaV1TextMessageSubnodeConfig };
};