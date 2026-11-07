import { BaseRepository, type OperationContext, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { PromotionRun } from '../entities/promotion-run.entity';
export type NewPromotionRun = Pick<PromotionRun, 'configId' | 'createdById' | 'direction' | 'type' | 'details' | 'reviewId'>;
export declare class PromotionRunRepository extends BaseRepository<PromotionRun> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    insertRun(run: NewPromotionRun, ctx?: OperationContext): Promise<PromotionRun>;
    attachReview(runId: string, reviewId: string, ctx?: OperationContext): Promise<void>;
}
