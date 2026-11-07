import type { PromotionConfigSettings, PromotionDirection } from '@n8n/api-types';
import { WithTimestampsAndStringId } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { PromotionConnection } from './promotion-connection.entity';
export declare class PromotionConfig extends WithTimestampsAndStringId {
    connectionId: string;
    name: string;
    direction: PromotionDirection;
    settings: PromotionConfigSettings;
    connection: Relation<PromotionConnection>;
}
