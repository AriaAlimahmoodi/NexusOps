import type { PromotionConnectionTarget, PromotionSshKeyType } from '@n8n/api-types';
import type { PromotionCacheDescriptor, PromotionOperationInput, ResolvedPromotionConfig } from './promotions.types';
export declare function buildPromotionBranchName(now: Date): string;
export declare function buildHttpsGitConfig({ repositoryUrl }: {
    repositoryUrl: string;
}): string[];
export declare function buildSshCommand(paths: {
    privateKeyPath: string;
    knownHostsPath: string;
}): string;
export declare function generateSshKeyPair(keyType: PromotionSshKeyType, comment: string): Promise<{
    publicKey: string;
    privateKey: string;
}>;
export declare function checkoutBranchName(config: ResolvedPromotionConfig): string;
export declare function repositoryUrl(input: PromotionOperationInput): string;
export declare function buildCacheDescriptor(source: {
    connectionId: string;
    configId: string;
    target: PromotionConnectionTarget;
    config: ResolvedPromotionConfig;
}): PromotionCacheDescriptor;
