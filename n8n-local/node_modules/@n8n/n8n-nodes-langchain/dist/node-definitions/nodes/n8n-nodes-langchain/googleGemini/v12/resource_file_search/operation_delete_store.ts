/**
 * Google Gemini Node - Version 1.2
 * Discriminator: resource=fileSearch, operation=deleteStore
 */


interface Credentials {
  googlePalmApi: CredentialReference;
}

/** Delete a File Search store */
export type LcGoogleGeminiV12FileSearchDeleteStoreParams = {
  resource: 'fileSearch';
  operation: 'deleteStore';
/**
 * The full name of the File Search store to delete (format: fileSearchStores/...)
 */
    fileSearchStoreName: string | Expression<string>;
/**
 * Whether to delete related Documents and objects. If false, deletion will fail if the store contains any Documents.
 * @default false
 */
    force?: boolean | Expression<boolean>;
};

export interface LcGoogleGeminiV12FileSearchDeleteStoreSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcGoogleGeminiV12FileSearchDeleteStoreNode = {
  type: '@n8n/n8n-nodes-langchain.googleGemini';
  version: 1.2;
  isTrigger: true;
  config: NodeConfig<LcGoogleGeminiV12FileSearchDeleteStoreParams> & { credentials?: Credentials } & { subnodes?: LcGoogleGeminiV12FileSearchDeleteStoreSubnodeConfig };
};