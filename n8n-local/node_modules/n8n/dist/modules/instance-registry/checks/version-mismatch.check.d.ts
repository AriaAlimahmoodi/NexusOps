import { type ClusterCheckContext, type ClusterCheckResult, type IClusterCheck } from '@n8n/decorators';
export declare class VersionMismatchCheck implements IClusterCheck {
    checkDescription: {
        name: string;
        displayName: string;
    };
    run(context: ClusterCheckContext): Promise<ClusterCheckResult>;
}
