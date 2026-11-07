/**
 * Moonshot Kimi Node - Version 1
 * Discriminator: resource=image, operation=analyze
 */


interface Credentials {
  moonshotApi: CredentialReference;
}

/** Analyze an image and answer questions about it */
export type LcMoonshotV1ImageAnalyzeParams = {
  resource: 'image';
  operation: 'analyze';
/**
 * Model
 * @searchListMethod modelSearch
 * @default {"mode":"list","value":""}
 */
    modelId?: { __rl: true; mode: 'list' | 'id'; value: string; cachedResultName?: string };
/**
 * Text Input
 * @default What's in this image?
 */
    text?: string | Expression<string>;
/**
 * Name of the binary field(s) which contains the image(s), separate multiple field names with commas
 * @hint The name of the input field containing the binary file data to be processed
 * @default data
 */
    binaryPropertyName?: string | Expression<string>;
/**
 * Whether to return a simplified version of the response instead of the raw data
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

export interface LcMoonshotV1ImageAnalyzeSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcMoonshotV1ImageAnalyzeNode = {
  type: '@n8n/n8n-nodes-langchain.moonshot';
  version: 1;
  isTrigger: true;
  config: NodeConfig<LcMoonshotV1ImageAnalyzeParams> & { credentials?: Credentials } & { subnodes?: LcMoonshotV1ImageAnalyzeSubnodeConfig };
};