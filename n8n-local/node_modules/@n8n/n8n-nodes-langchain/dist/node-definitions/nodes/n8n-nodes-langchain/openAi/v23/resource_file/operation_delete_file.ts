/**
 * OpenAI Node - Version 2.3
 * Discriminator: resource=file, operation=deleteFile
 */


interface Credentials {
  openAiApi: CredentialReference;
}

/** Delete a file from the server */
export type LcOpenAiV23FileDeleteFileParams = {
  resource: 'file';
  operation: 'deleteFile';
/**
 * File
 * @searchListMethod fileSearch
 * @default {"mode":"list","value":""}
 */
    fileId?: { __rl: true; mode: 'list' | 'id'; value: string; cachedResultName?: string };
};

export interface LcOpenAiV23FileDeleteFileSubnodeConfig {
  tools?: ToolInstance[];
  memory?: MemoryInstance;
}

export type LcOpenAiV23FileDeleteFileNode = {
  type: '@n8n/n8n-nodes-langchain.openAi';
  version: 2.3;
  isTrigger: true;
  config: NodeConfig<LcOpenAiV23FileDeleteFileParams> & { credentials?: Credentials } & { subnodes?: LcOpenAiV23FileDeleteFileSubnodeConfig };
};