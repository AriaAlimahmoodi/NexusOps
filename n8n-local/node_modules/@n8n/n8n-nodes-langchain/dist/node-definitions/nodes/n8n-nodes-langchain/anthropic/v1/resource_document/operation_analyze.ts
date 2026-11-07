/**
 * Anthropic Node - Version 1
 * Discriminator: resource=document, operation=analyze
 */


interface Credentials {
  anthropicApi: CredentialReference;
}

/** Take in documents and answer questions about them */
export type LcAnthropicV1DocumentAnalyzeParams = {
  resource: 'document';
  operation: 'analyze';
/**
 * Model
 * @searchListMethod modelSearch
 * @default {"mode":"list","value":""}
 */
    modelId?: { __rl: true; mode: 'list' | 'id'; value: string; cachedResultName?: string };
/**
 * Text Input
 * @default What's in this document?
 */
    text?: string | Expression<string>;
/**
 * Input Type
 * @default url
 */
    inputType?: 'url' | 'binary' | Expression<string>;
/**
 * URL(s) of the document(s) to analyze, multiple URLs can be added separated by comma
 * @displayOptions.show { inputType: ["url"] }
 */
    documentUrls?: string | Expression<string>;
/**
 * Name of the binary field(s) which contains the document(s), seperate multiple field names with commas
 * @hint The name of the input field containing the binary file data to be processed
 * @displayOptions.show { inputType: ["binary"] }
 * @default data
 */
    binaryPropertyName?: string | Expression<string>;
/**
 * Whether to simplify the response or not
 * @default true
 */
    simplify?: boolean | Expression<boolean>;
/**
 * Options
 * @default {}
 */
    options?: {
    /** Fewer tokens will result in shorter, less detailed image description
     * @default 1024
     */
    maxTokens?: number | Expression<number>;
  };
};

export interface LcAnthropicV1DocumentAnalyzeSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcAnthropicV1DocumentAnalyzeNode = {
  type: '@n8n/n8n-nodes-langchain.anthropic';
  version: 1;
  isTrigger: true;
  config: NodeConfig<LcAnthropicV1DocumentAnalyzeParams> & { credentials?: Credentials } & { subnodes?: LcAnthropicV1DocumentAnalyzeSubnodeConfig };
};