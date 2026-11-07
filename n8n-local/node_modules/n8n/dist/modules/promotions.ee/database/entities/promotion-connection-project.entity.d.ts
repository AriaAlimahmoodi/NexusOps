import { WithTimestamps } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { PromotionConnection } from './promotion-connection.entity';
export declare class PromotionConnectionProject extends WithTimestamps {
    projectId: string;
    connectionId: string;
    connection: Relation<PromotionConnection>;
}
