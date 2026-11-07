/**
 * MiniMax Node - Version 1
 * Discriminator: resource=text, operation=message
 */


interface Credentials {
  minimaxApi: CredentialReference;
}

/** Send a message and get a response from a MiniMax model */
export type LcMinimaxV1TextMessageParams = {
  resource: 'text';
  operation: 'message';
/**
 * The model to use for generating the response
 * @default MiniMax-M2.7
 */
    modelId?: 'MiniMax-M2' | 'MiniMax-M2.1' | 'MiniMax-M2.1-highspeed' | 'MiniMax-M2.5' | 'MiniMax-M2.5-highspeed' | 'MiniMax-M2.7' | 'MiniMax-M2.7-highspeed' | Expression<string>;
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
 * Whether to return a simplified version of the response instead of the raw data
 * @default true
 */
    simplify?: boolean | Expression<boolean>;
/**
 * Options
 * @default {}
 */
    options?: {
    /** Whether to strip chain-of-thought reasoning from the response, returning only the final answer
     * @default true
     */
    hideThinking?: boolean | Expression<boolean>;
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
     * @default 0.95
     */
    topP?: number | Expression<number>;
    /** System Message
     */
    system?: string | Expression<string>;
  };
};

export interface LcMinimaxV1TextMessageSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcMinimaxV1TextMessageNode = {
  type: '@n8n/n8n-nodes-langchain.minimax';
  version: 1;
  isTrigger: true;
  config: NodeConfig<LcMinimaxV1TextMessageParams> & { credentials?: Credentials } & { subnodes?: LcMinimaxV1TextMessageSubnodeConfig };
};