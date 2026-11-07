import type { ModelConfig } from '@n8n/instance-ai';
export declare function withModelName(config: ModelConfig, modelName: string, { dropMainProviderPrefix }?: {
    dropMainProviderPrefix?: boolean;
}): ModelConfig | undefined;
export declare function modelNameForProvider(value: string, mainProvider: string): string;
