/**
 * Ollama Model Node - Version 1
 * Language Model Ollama
 */


export interface LcLmOllamaV1Params {
/**
 * The model which will generate the completion. To download models, visit &lt;a href="https://ollama.ai/library"&gt;Ollama Models Library&lt;/a&gt;.
 * @default llama3.2
 */
    model?: string | Expression<string>;
/**
 * Additional options to add
 * @default {}
 */
    options?: {
    /** Whether to enable (default) thinking mode for supported models. When enabled, the model's thinking process is separated from the output. When disabled, the model outputs content directly (only for supported models).
     * @default true
     */
    think?: boolean | Expression<boolean>;
    /** Controls the randomness of the generated text. Lower values make the output more focused and deterministic, while higher values make it more diverse and random.
     * @default 0.7
     */
    temperature?: number | Expression<number>;
    /** Limits the number of highest probability vocabulary tokens to consider at each step. A higher value increases diversity but may reduce coherence. Set to -1 to disable.
     * @default -1
     */
    topK?: number | Expression<number>;
    /** Chooses from the smallest possible set of tokens whose cumulative probability exceeds the probability top_p. Helps generate more human-like text by reducing repetitions.
     * @default 1
     */
    topP?: number | Expression<number>;
    /** Adjusts the penalty for tokens that have already appeared in the generated text. Higher values discourage repetition.
     * @default 0
     */
    frequencyPenalty?: number | Expression<number>;
    /** Specifies the duration to keep the loaded model in memory after use. Useful for frequently used models. Format: 1h30m (1 hour 30 minutes).
     * @default 5m
     */
    keepAlive?: string | Expression<string>;
    /** Whether to Activate low VRAM mode, which reduces memory usage at the cost of slower generation speed. Useful for GPUs with limited memory.
     * @default false
     */
    lowVram?: boolean | Expression<boolean>;
    /** Specifies the ID of the GPU to use for the main computation. Only change this if you have multiple GPUs.
     * @default 0
     */
    mainGpu?: number | Expression<number>;
    /** Sets the batch size for prompt processing. Larger batch sizes may improve generation speed but increase memory usage.
     * @default 512
     */
    numBatch?: number | Expression<number>;
    /** The maximum number of tokens to use as context for generating the next token. Smaller values reduce memory usage, while larger values provide more context to the model.
     * @default 2048
     */
    numCtx?: number | Expression<number>;
    /** Specifies the number of GPUs to use for parallel processing. Set to -1 for auto-detection.
     * @default -1
     */
    numGpu?: number | Expression<number>;
    /** The maximum number of tokens to generate. Set to -1 for no limit. Be cautious when setting this to a large value, as it can lead to very long outputs.
     * @default -1
     */
    numPredict?: number | Expression<number>;
    /** Specifies the number of CPU threads to use for processing. Set to 0 for auto-detection.
     * @default 0
     */
    numThread?: number | Expression<number>;
    /** Whether the model will be less likely to generate newline characters, encouraging longer continuous sequences of text
     * @default true
     */
    penalizeNewline?: boolean | Expression<boolean>;
    /** Adjusts the penalty for tokens based on their presence in the generated text so far. Positive values penalize tokens that have already appeared, encouraging diversity.
     * @default 0
     */
    presencePenalty?: number | Expression<number>;
    /** Adjusts the penalty factor for repeated tokens. Higher values more strongly discourage repetition. Set to 1.0 to disable repetition penalty.
     * @default 1
     */
    repeatPenalty?: number | Expression<number>;
    /** Whether to lock the model in memory to prevent swapping. This can improve performance but requires sufficient available memory.
     * @default false
     */
    useMLock?: boolean | Expression<boolean>;
    /** Whether to use memory mapping for loading the model. This can reduce memory usage but may impact performance. Recommended to keep enabled.
     * @default true
     */
    useMMap?: boolean | Expression<boolean>;
    /** Whether to only load the model vocabulary without the weights. Useful for quickly testing tokenization.
     * @default false
     */
    vocabOnly?: boolean | Expression<boolean>;
    /** Specifies the format of the API response
     * @default default
     */
    format?: 'default' | 'json' | Expression<string>;
  };
}

export interface LcLmOllamaV1Credentials {
  ollamaApi: CredentialReference;
}

interface LcLmOllamaV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.lmOllama';
  version: 1;
}

export type LcLmOllamaV1ParamsNode = LcLmOllamaV1NodeBase & {
  config: NodeConfig<LcLmOllamaV1Params> & { credentials?: LcLmOllamaV1Credentials };
};

export type LcLmOllamaV1Node = LcLmOllamaV1ParamsNode;