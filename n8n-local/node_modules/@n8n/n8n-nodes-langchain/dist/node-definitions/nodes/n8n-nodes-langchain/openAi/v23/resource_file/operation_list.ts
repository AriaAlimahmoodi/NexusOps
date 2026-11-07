/**
 * OpenAI Node - Version 2.3
 * Discriminator: resource=file, operation=list
 */


interface Credentials {
  openAiApi: CredentialReference;
}

/** Returns a list of files that belong to the user's organization */
export type LcOpenAiV23FileListParams = {
  resource: 'file';
  operation: 'list';
/**
 * Options
 * @default {}
 */
    options?: {
    /** Only return files with the given purpose
     * @default any
     */
    purpose?: 'any' | 'assistants' | 'fine-tune' | 'vision' | 'user_data' | Expression<string>;
  };
};

export interface LcOpenAiV23FileListSubnodeConfig {
  tools?: ToolInstance[];
  memory?: MemoryInstance;
}

export type LcOpenAiV23FileListNode = {
  type: '@n8n/n8n-nodes-langchain.openAi';
  version: 2.3;
  isTrigger: true;
  config: NodeConfig<LcOpenAiV23FileListParams> & { credentials?: Credentials } & { subnodes?: LcOpenAiV23FileListSubnodeConfig };
};