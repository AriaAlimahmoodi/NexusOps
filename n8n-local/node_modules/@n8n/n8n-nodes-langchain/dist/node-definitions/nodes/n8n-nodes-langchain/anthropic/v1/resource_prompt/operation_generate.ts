/**
 * Anthropic Node - Version 1
 * Discriminator: resource=prompt, operation=generate
 */


interface Credentials {
  anthropicApi: CredentialReference;
}

/** Generate a prompt for a model */
export type LcAnthropicV1PromptGenerateParams = {
  resource: 'prompt';
  operation: 'generate';
/**
 * Description of the prompt's purpose
 */
    task?: string | Expression<string>;
/**
 * Whether to return a simplified version of the response instead of the raw data
 * @default true
 */
    simplify?: boolean | Expression<boolean>;
};

export interface LcAnthropicV1PromptGenerateSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcAnthropicV1PromptGenerateNode = {
  type: '@n8n/n8n-nodes-langchain.anthropic';
  version: 1;
  isTrigger: true;
  config: NodeConfig<LcAnthropicV1PromptGenerateParams> & { credentials?: Credentials } & { subnodes?: LcAnthropicV1PromptGenerateSubnodeConfig };
};