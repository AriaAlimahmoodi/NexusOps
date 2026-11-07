import type { PromotionConnectionScope, PromotionConnectionTarget, PromotionProviderAuthType, PromotionProviderType, promotionGitApplySettingsSchema, promotionGitPromoteSettingsSchema } from '@n8n/api-types';
import { z } from 'zod';
import type { PackageFile } from './base-branch-files';
export type PromotionGitApplySettings = z.infer<typeof promotionGitApplySettingsSchema>;
export type PromotionGitPromoteSettings = z.infer<typeof promotionGitPromoteSettingsSchema>;
export declare const promotionSshKeyAuthPayloadSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    privateKey: z.ZodString;
}, "strict", z.ZodTypeAny, {
    schemaVersion: 1;
    privateKey: string;
}, {
    schemaVersion: 1;
    privateKey: string;
}>;
export declare const promotionTokenAuthPayloadSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    username: z.ZodString;
    password: z.ZodString;
}, "strict", z.ZodTypeAny, {
    schemaVersion: 1;
    username: string;
    password: string;
}, {
    schemaVersion: 1;
    username: string;
    password: string;
}>;
export type PromotionAuthPayload = z.infer<typeof promotionSshKeyAuthPayloadSchema> | z.infer<typeof promotionTokenAuthPayloadSchema>;
export type PromotionGitCredentials = {
    authType: 'ssh-key';
    privateKey: string;
} | {
    authType: 'token';
    username: string;
    password: string;
};
export type ResolvedPromotionConfig = {
    direction: 'apply';
    settings: PromotionGitApplySettings;
} | {
    direction: 'promote';
    settings: PromotionGitPromoteSettings;
};
export type PromotionOperationInput = Readonly<{
    connectionId: string;
    connectionScope: PromotionConnectionScope;
    configId: string;
    providerId: string;
    providerType: PromotionProviderType;
    authType: PromotionProviderAuthType;
    encryptedAuth: string;
    target: PromotionConnectionTarget;
    config: ResolvedPromotionConfig;
}>;
export type BranchPackage = Readonly<{
    configId: string;
    branchName: string;
    commitSha: string | null;
    files: PackageFile[];
    readFiles: (paths: readonly string[]) => Promise<Map<string, string>>;
}>;
export type PromotionCacheDescriptor = {
    schemaVersion: 1;
    configId: string;
    connectionId: string;
    remoteUrl: string;
    checkoutBranchName: string;
};
