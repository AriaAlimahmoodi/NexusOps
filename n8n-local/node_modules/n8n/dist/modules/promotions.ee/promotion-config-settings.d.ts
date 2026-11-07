import type { PromotionDirection } from '@n8n/api-types';
import type { ResolvedPromotionConfig } from './promotions.types';
export declare function resolveStoredConfig(row: {
    direction: PromotionDirection;
    settings: unknown;
}): ResolvedPromotionConfig | null;
