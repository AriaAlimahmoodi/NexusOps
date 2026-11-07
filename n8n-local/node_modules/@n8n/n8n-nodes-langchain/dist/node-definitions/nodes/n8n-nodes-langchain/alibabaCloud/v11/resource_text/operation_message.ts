/**
 * Qwen Cloud Node - Version 1.1
 * Discriminator: resource=text, operation=message
 */


interface Credentials {
  alibabaCloudApi: CredentialReference;
}

/** Create a completion with a Qwen model */
export type LcAlibabaCloudV11TextMessageParams = {
  resource: 'text';
  operation: 'message';
/**
 * Model
 * @searchListMethod textModelSearch
 * @default {"mode":"list","value":""}
 */
    modelId?: { __rl: true; mode: 'list' | 'id'; value: string; cachedResultName?: string };
/**
 * Messages
 * @default {"messageValues":[{"content":"","role":"user"}]}
 */
    messages?: {
        /** Message
     */
    messageValues?: Array<{
      /** The content of the message
       */
      content?: string | Expression<string>;
      /** The role of the message sender
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
    /** Whether to enable web search for up-to-date information
     * @default false
     */
    enableSearch?: boolean | Expression<boolean>;
    /** Maximum number of tokens to generate
     * @default 2000
     */
    maxTokens?: number | Expression<number>;
    /** Maximum number of tool-calling iterations before stopping. Set to 0 for unlimited.
     * @default 15
     */
    maxToolsIterations?: number | Expression<number>;
    /** Penalty for token repetition. Higher values reduce repetition.
     * @default 1.1
     */
    repetitionPenalty?: number | Expression<number>;
    /** Random seed for reproducible outputs
     * @default 1234
     */
    seed?: number | Expression<number>;
    /** Comma-separated list of sequences where the API will stop generating
     */
    stop?: string | Expression<string>;
    /** System Message
     */
    system?: string | Expression<string>;
    /** Controls randomness in the output. Lower values make output more focused and deterministic.
     * @default 1
     */
    temperature?: number | Expression<number>;
    /** Limits the sampling pool to top K tokens
     * @default 50
     */
    topK?: number | Expression<number>;
    /** Nucleus sampling parameter. Lower values make output more focused.
     * @default 0.9
     */
    topP?: number | Expression<number>;
  };
};

export interface LcAlibabaCloudV11TextMessageSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcAlibabaCloudV11TextMessageNode = {
  type: '@n8n/n8n-nodes-langchain.alibabaCloud';
  version: 1.1;
  isTrigger: true;
  config: NodeConfig<LcAlibabaCloudV11TextMessageParams> & { credentials?: Credentials } & { subnodes?: LcAlibabaCloudV11TextMessageSubnodeConfig };
};