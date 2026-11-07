import { type PromotionConnectionTarget } from '@n8n/api-types';
import { z } from 'zod';
import type { PromotionProvider } from '../database/entities/promotion-provider.entity';
export declare const promotionStoredConnectionTargetSchema: z.ZodUnion<[z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    remoteUrl: z.ZodString;
}, "strict", z.ZodTypeAny, {
    schemaVersion: 1;
    remoteUrl: string;
}, {
    schemaVersion: 1;
    remoteUrl: string;
}>, z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    repositoryPath: z.ZodEffects<z.ZodString, string, string>;
}, "strict", z.ZodTypeAny, {
    schemaVersion: 1;
    repositoryPath: string;
}, {
    schemaVersion: 1;
    repositoryPath: string;
}>]>;
export type PromotionStoredConnectionTarget = z.infer<typeof promotionStoredConnectionTargetSchema>;
type GitHostProvider = Pick<PromotionProvider, 'type' | 'config'>;
export declare function repositoryPathFromUrl(baseUrl: string, remoteUrl: string): string;
export declare function storePromotionTarget(provider: GitHostProvider, target: PromotionConnectionTarget): PromotionStoredConnectionTarget;
export declare function resolvePromotionTarget(provider: GitHostProvider, stored: unknown): PromotionConnectionTarget;
export declare function resolvePromotionGitTarget(provider: GitHostProvider, stored: unknown): PromotionConnectionTarget;
export declare function repositoryUrlFromPath(baseUrl: string, repositoryPath: string): string;
export {};
