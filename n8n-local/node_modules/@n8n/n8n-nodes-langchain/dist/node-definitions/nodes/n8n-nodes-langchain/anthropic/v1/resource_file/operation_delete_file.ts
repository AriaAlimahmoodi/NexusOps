/**
 * Anthropic Node - Version 1
 * Discriminator: resource=file, operation=deleteFile
 */


interface Credentials {
  anthropicApi: CredentialReference;
}

/** Delete a file from the Anthropic API */
export type LcAnthropicV1FileDeleteFileParams = {
  resource: 'file';
  operation: 'deleteFile';
/**
 * ID of the file to delete
 */
    fileId?: string | Expression<string>;
};

export interface LcAnthropicV1FileDeleteFileSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcAnthropicV1FileDeleteFileNode = {
  type: '@n8n/n8n-nodes-langchain.anthropic';
  version: 1;
  isTrigger: true;
  config: NodeConfig<LcAnthropicV1FileDeleteFileParams> & { credentials?: Credentials } & { subnodes?: LcAnthropicV1FileDeleteFileSubnodeConfig };
};