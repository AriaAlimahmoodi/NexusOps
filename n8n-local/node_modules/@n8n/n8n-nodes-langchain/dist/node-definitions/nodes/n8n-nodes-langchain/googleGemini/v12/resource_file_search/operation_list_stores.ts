/**
 * Google Gemini Node - Version 1.2
 * Discriminator: resource=fileSearch, operation=listStores
 */


interface Credentials {
  googlePalmApi: CredentialReference;
}

/** List all File Search stores owned by the user */
export type LcGoogleGeminiV12FileSearchListStoresParams = {
  resource: 'fileSearch';
  operation: 'listStores';
/**
 * Maximum number of File Search stores to return per page (max 20)
 * @default 10
 */
    pageSize?: number | Expression<number>;
/**
 * Token from a previous page to retrieve the next page of results
 */
    pageToken?: string | Expression<string>;
};

export interface LcGoogleGeminiV12FileSearchListStoresSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcGoogleGeminiV12FileSearchListStoresNode = {
  type: '@n8n/n8n-nodes-langchain.googleGemini';
  version: 1.2;
  isTrigger: true;
  config: NodeConfig<LcGoogleGeminiV12FileSearchListStoresParams> & { credentials?: Credentials } & { subnodes?: LcGoogleGeminiV12FileSearchListStoresSubnodeConfig };
};