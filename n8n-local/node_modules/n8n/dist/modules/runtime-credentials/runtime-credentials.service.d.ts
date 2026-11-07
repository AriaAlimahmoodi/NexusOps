import { Logger } from '@n8n/backend-common';
import { INodeExecutionData, ISecureArtifactsV1 } from 'n8n-workflow';
import { RuntimeCredentialsConfig } from './runtime-credentials.config';
type ArtifactItem = ISecureArtifactsV1['artifacts'][string];
export type StripResult = {
    triggerItems: INodeExecutionData[];
    artifactsByAlias: Record<string, ArtifactItem>;
};
export declare class RuntimeCredentialsService {
    private readonly logger;
    private readonly config;
    private sensitiveFieldRules;
    constructor(logger: Logger, config: RuntimeCredentialsConfig);
    init(): void;
    private extractFromItem;
    strip(items: INodeExecutionData[], triggerNodeType: string): StripResult;
}
export {};
