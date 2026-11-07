/**
 * Google Gemini Node - Version 1.2
 * Discriminator: resource=video, operation=download
 */


interface Credentials {
  googlePalmApi: CredentialReference;
}

/** Download a generated video from the Google Gemini API using a URL */
export type LcGoogleGeminiV12VideoDownloadParams = {
  resource: 'video';
  operation: 'download';
/**
 * The URL from Google Gemini API to download the video from
 */
    url?: string | Expression<string>;
/**
 * Options
 * @default {}
 */
    options?: {
    /** Put Output in Field
     * @hint The name of the output field to put the binary file data in
     * @default data
     */
    binaryPropertyOutput?: string | Expression<string>;
  };
};

export interface LcGoogleGeminiV12VideoDownloadSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcGoogleGeminiV12VideoDownloadNode = {
  type: '@n8n/n8n-nodes-langchain.googleGemini';
  version: 1.2;
  isTrigger: true;
  config: NodeConfig<LcGoogleGeminiV12VideoDownloadParams> & { credentials?: Credentials } & { subnodes?: LcGoogleGeminiV12VideoDownloadSubnodeConfig };
};