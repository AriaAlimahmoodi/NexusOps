/**
 * MiniMax Node - Version 1
 * Discriminator: resource=image, operation=generate
 */


interface Credentials {
  minimaxApi: CredentialReference;
}

/** Create an image from a text prompt */
export type LcMinimaxV1ImageGenerateParams = {
  resource: 'image';
  operation: 'generate';
/**
 * The model to use for image generation
 * @default image-01
 */
    modelId?: 'image-01' | Expression<string>;
/**
 * Text description of the image to generate (max 1500 characters)
 */
    prompt: string | Expression<string>;
/**
 * Aspect ratio of the generated image
 * @default 1:1
 */
    aspectRatio?: '1:1' | '16:9' | '2:3' | '21:9' | '3:2' | '3:4' | '4:3' | '9:16' | Expression<string>;
/**
 * Number of images to generate per request (1-9)
 * @default 1
 */
    numberOfImages?: number | Expression<number>;
/**
 * Whether to download the generated image as binary data. When disabled, only the image URL is returned.
 * @default true
 */
    downloadImage?: boolean | Expression<boolean>;
/**
 * Options
 * @default {}
 */
    options?: {
    /** Whether to automatically optimize the prompt for better results
     * @default false
     */
    promptOptimizer?: boolean | Expression<boolean>;
    /** Random seed for reproducible outputs. Using the same seed and parameters produces the same image.
     * @default 0
     */
    seed?: number | Expression<number>;
  };
};

export interface LcMinimaxV1ImageGenerateSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcMinimaxV1ImageGenerateNode = {
  type: '@n8n/n8n-nodes-langchain.minimax';
  version: 1;
  isTrigger: true;
  config: NodeConfig<LcMinimaxV1ImageGenerateParams> & { credentials?: Credentials } & { subnodes?: LcMinimaxV1ImageGenerateSubnodeConfig };
};