import type { PromotionProviderAuthType, PromotionProviderConfig, PromotionProviderType } from '@n8n/api-types';
import { WithTimestampsAndStringId } from '@n8n/db';
export declare class PromotionProvider extends WithTimestampsAndStringId {
    name: string;
    type: PromotionProviderType;
    authType: PromotionProviderAuthType;
    config: PromotionProviderConfig;
    auth: string;
}
