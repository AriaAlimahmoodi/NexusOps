/**
 * Anthropic Node - Version 1
 * Discriminator: resource=prompt, operation=templatize
 */


interface Credentials {
  anthropicApi: CredentialReference;
}

/** Templatize a prompt for a model */
export type LcAnthropicV1PromptTemplatizeParams = {
  resource: 'prompt';
  operation: 'templatize';
/**
 * Messages that constitute the prompt to be templatized
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
    /** The existing system prompt to templatize
     */
    system?: string | Expression<string>;
  };
};

export interface LcAnthropicV1PromptTemplatizeSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcAnthropicV1PromptTemplatizeNode = {
  type: '@n8n/n8n-nodes-langchain.anthropic';
  version: 1;
  isTrigger: true;
  config: NodeConfig<LcAnthropicV1PromptTemplatizeParams> & { credentials?: Credentials } & { subnodes?: LcAnthropicV1PromptTemplatizeSubnodeConfig };
};