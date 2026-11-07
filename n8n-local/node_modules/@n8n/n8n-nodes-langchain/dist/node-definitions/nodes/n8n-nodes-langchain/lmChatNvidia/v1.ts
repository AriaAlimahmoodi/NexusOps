/**
 * NVIDIA Nemotron Chat Model Node - Version 1
 * NVIDIA Nemotron models from build.nvidia.com or self-hosted NIM
 */


export interface LcLmChatNvidiaV1Params {
/**
 * The Nemotron model which will generate the completion. &lt;a href="https://build.nvidia.com/models"&gt;Learn more&lt;/a&gt;.
 * @default nvidia/llama-3.3-nemotron-super-49b-v1
 */
    model?: 'nvidia/llama-3.1-nemotron-nano-8b-v1' | 'nvidia/llama-3.3-nemotron-super-49b-v1' | 'nvidia/llama-3.3-nemotron-super-49b-v1.5' | 'nvidia/nemotron-3-nano-30b-a3b' | 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning' | 'nvidia/nemotron-3-super-120b-a12b' | 'nvidia/nemotron-nano-12b-v2-vl' | 'nvidia/nvidia-nemotron-nano-9b-v2' | Expression<string>;
/**
 * Additional options to add
 * @default {}
 */
    options?: {
    /** Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim
     * @default 0
     */
    frequencyPenalty?: number | Expression<number>;
    /** The maximum number of tokens to generate in the completion. Use -1 for the model default.
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

export interface LcLmChatNvidiaV1Credentials {
  nvidiaApi: CredentialReference;
}

interface LcLmChatNvidiaV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.lmChatNvidia';
  version: 1;
}

export type LcLmChatNvidiaV1ParamsNode = LcLmChatNvidiaV1NodeBase & {
  config: NodeConfig<LcLmChatNvidiaV1Params> & { credentials?: LcLmChatNvidiaV1Credentials };
};

export type LcLmChatNvidiaV1Node = LcLmChatNvidiaV1ParamsNode;