/**
 * Google Gemini Node - Version 1.2
 * Discriminator: resource=file, operation=upload
 */


interface Credentials {
  googlePalmApi: CredentialReference;
}

/** Upload a file to the Google Gemini API for later use */
export type LcGoogleGeminiV12FileUploadParams = {
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
 * Name of the binary property which contains the file
 * @hint The name of the input field containing the binary file data to be processed
 * @displayOptions.show { inputType: ["binary"] }
 * @default data
 */
    binaryPropertyName?: string | Expression<string>;
};

export interface LcGoogleGeminiV12FileUploadSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcGoogleGeminiV12FileUploadNode = {
  type: '@n8n/n8n-nodes-langchain.googleGemini';
  version: 1.2;
  isTrigger: true;
  config: NodeConfig<LcGoogleGeminiV12FileUploadParams> & { credentials?: Credentials } & { subnodes?: LcGoogleGeminiV12FileUploadSubnodeConfig };
};