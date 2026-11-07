import { BaseRepository, type OperationContext, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { PromotionConnectionProject } from '../entities/promotion-connection-project.entity';
export declare class PromotionConnectionProjectRepository extends BaseRepository<PromotionConnectionProject> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    findByProjectId(projectId: string, ctx?: OperationContext): Promise<PromotionConnectionProject | null>;
    linkProject(projectId: string, connectionId: string): Promise<PromotionConnectionProject>;
    unlinkProject(projectId: string, connectionId: string): Promise<number>;
    findProjectIdsByConnection(connectionId: string): Promise<string[]>;
}
