/**
 * OpenAI Node - Version 2.3
 * Discriminator: resource=file, operation=upload
 */


interface Credentials {
  openAiApi: CredentialReference;
}

/** Upload a file that can be used across various endpoints */
export type LcOpenAiV23FileUploadParams = {
  resource: 'file';
  operation: 'upload';
/**
 * Name of the binary property which contains the file. The size of individual files can be a maximum of 512 MB or 2 million tokens for Assistants.
 * @hint The name of the input field containing the binary file data to be processed
 * @default data
 */
    binaryPropertyName?: string | Expression<string>;
/**
 * Options
 * @default {}
 */
    options?: {
    /** The intended purpose of the uploaded file, the 'Fine-tuning' only supports .jsonl files
     * @default user_data
     */
    purpose?: 'assistants' | 'fine-tune' | 'vision' | 'user_data' | Expression<string>;
  };
};

export interface LcOpenAiV23FileUploadSubnodeConfig {
  tools?: ToolInstance[];
  memory?: MemoryInstance;
}

export type LcOpenAiV23FileUploadNode = {
  type: '@n8n/n8n-nodes-langchain.openAi';
  version: 2.3;
  isTrigger: true;
  config: NodeConfig<LcOpenAiV23FileUploadParams> & { credentials?: Credentials } & { subnodes?: LcOpenAiV23FileUploadSubnodeConfig };
};