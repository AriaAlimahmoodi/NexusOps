import type { PromotionDirection, PromotionRunDetails, PromotionRunType } from '@n8n/api-types';
import { User, WithCreatedAt } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { PromotionConfig } from './promotion-config.entity';
import { PromotionReview } from './promotion-review.entity';
export declare class PromotionRun extends WithCreatedAt {
    id: string;
    generateId(): void;
    configId: string | null;
    direction: PromotionDirection;
    type: PromotionRunType;
    createdById: string | null;
    details: PromotionRunDetails | null;
    reviewId: string | null;
    config: Relation<PromotionConfig> | null;
    createdBy: Relation<User> | null;
    review: Relation<PromotionReview> | null;
}
