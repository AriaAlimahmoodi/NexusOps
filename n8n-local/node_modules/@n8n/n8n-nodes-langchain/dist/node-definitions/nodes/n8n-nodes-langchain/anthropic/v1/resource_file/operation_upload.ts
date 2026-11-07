/**
 * Anthropic Node - Version 1
 * Discriminator: resource=file, operation=upload
 */


interface Credentials {
  anthropicApi: CredentialReference;
}

/** Upload a file to the Anthropic API for later use */
export type LcAnthropicV1FileUploadParams = {
  resource: 'file';
  operation: 'upload';
/**
 * Input Type
 * @default url
 */
    inputType?: 'url' | 'binary' | Expression<string>;
/**
 * URL of the file to upload
 * @displayOptions.show { inputType: ["url"] }
 */
    fileUrl?: string | Expression<string>;
/**
 * Name of the binary field which contains the file
 * @hint The name of the input field containing the binary file data to be processed
 * @displayOptions.show { inputType: ["binary"] }
 * @default data
 */
    binaryPropertyName?: string | Expression<string>;
/**
 * Options
 * @default {}
 */
    options?: {
    /** The file name to use for the uploaded file
     */
    fileName?: string | Expression<string>;
  };
};

export interface LcAnthropicV1FileUploadSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcAnthropicV1FileUploadNode = {
  type: '@n8n/n8n-nodes-langchain.anthropic';
  version: 1;
  isTrigger: true;
  config: NodeConfig<LcAnthropicV1FileUploadParams> & { credentials?: Credentials } & { subnodes?: LcAnthropicV1FileUploadSubnodeConfig };
};