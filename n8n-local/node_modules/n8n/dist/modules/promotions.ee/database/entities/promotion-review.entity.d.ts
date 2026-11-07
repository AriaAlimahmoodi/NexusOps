import type { PromotionReviewState, PromotionReviewType } from '@n8n/api-types';
import { User, WithCreatedAt } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { PromotionConnection } from './promotion-connection.entity';
import { PromotionRun } from './promotion-run.entity';
export declare class PromotionReview extends WithCreatedAt {
    id: string;
    generateId(): void;
    connectionId: string | null;
    type: PromotionReviewType;
    remoteReviewId: string | null;
    state: PromotionReviewState;
    lastStateChangeAt: Date | null;
    createdById: string | null;
    approvedById: string | null;
    approvedAt: Date | null;
    connection: Relation<PromotionConnection> | null;
    createdBy: Relation<User> | null;
    approvedBy: Relation<User> | null;
    runs: Relation<PromotionRun>[];
}
