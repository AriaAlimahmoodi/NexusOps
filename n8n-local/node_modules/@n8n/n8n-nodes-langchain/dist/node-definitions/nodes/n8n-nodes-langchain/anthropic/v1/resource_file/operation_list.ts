/**
 * Anthropic Node - Version 1
 * Discriminator: resource=file, operation=list
 */


interface Credentials {
  anthropicApi: CredentialReference;
}

/** List files from the Anthropic API */
export type LcAnthropicV1FileListParams = {
  resource: 'file';
  operation: 'list';
/**
 * Whether to return all results or only up to a given limit
 * @default false
 */
    returnAll?: boolean | Expression<boolean>;
/**
 * Max number of results to return
 * @displayOptions.show { returnAll: [false] }
 * @default 50
 */
    limit?: number | Expression<number>;
};

export interface LcAnthropicV1FileListSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcAnthropicV1FileListNode = {
  type: '@n8n/n8n-nodes-langchain.anthropic';
  version: 1;
  isTrigger: true;
  config: NodeConfig<LcAnthropicV1FileListParams> & { credentials?: Credentials } & { subnodes?: LcAnthropicV1FileListSubnodeConfig };
};