import type { PromotionReviewTab } from '@n8n/api-types';
import { BaseRepository, type OperationContext, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { PromotionReview } from '../entities/promotion-review.entity';
export type NewPromotionReview = Pick<PromotionReview, 'id' | 'connectionId' | 'type' | 'remoteReviewId' | 'createdById'>;
export declare class PromotionReviewRepository extends BaseRepository<PromotionReview> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    insertReview(review: NewPromotionReview, ctx?: OperationContext): Promise<PromotionReview>;
    findByIdWithRelations(id: string): Promise<PromotionReview | null>;
    listReviews(options: {
        tab?: PromotionReviewTab;
        offset: number;
        limit: number;
    }): Promise<{
        count: number;
        data: PromotionReview[];
    }>;
}
