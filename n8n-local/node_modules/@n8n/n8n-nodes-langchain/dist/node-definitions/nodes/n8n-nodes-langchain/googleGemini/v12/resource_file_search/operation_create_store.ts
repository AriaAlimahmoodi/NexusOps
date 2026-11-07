/**
 * Google Gemini Node - Version 1.2
 * Discriminator: resource=fileSearch, operation=createStore
 */


interface Credentials {
  googlePalmApi: CredentialReference;
}

/** Create a new File Search store for RAG (Retrieval Augmented Generation) */
export type LcGoogleGeminiV12FileSearchCreateStoreParams = {
  resource: 'fileSearch';
  operation: 'createStore';
/**
 * A human-readable name for the File Search store
 */
    displayName: string | Expression<string>;
};

export interface LcGoogleGeminiV12FileSearchCreateStoreSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcGoogleGeminiV12FileSearchCreateStoreNode = {
  type: '@n8n/n8n-nodes-langchain.googleGemini';
  version: 1.2;
  isTrigger: true;
  config: NodeConfig<LcGoogleGeminiV12FileSearchCreateStoreParams> & { credentials?: Credentials } & { subnodes?: LcGoogleGeminiV12FileSearchCreateStoreSubnodeConfig };
};