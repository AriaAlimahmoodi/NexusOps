import type { PromotionConnectionScope } from '@n8n/api-types';
import { BaseRepository, type OperationContext, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { PromotionConnection } from '../entities/promotion-connection.entity';
type NewPromotionConnection = Pick<PromotionConnection, 'name' | 'scope' | 'providerId' | 'target'>;
export type PromotionConnectionFilter = {
    scope?: PromotionConnectionScope;
    providerId?: string;
};
export declare class PromotionConnectionRepository extends BaseRepository<PromotionConnection> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    findByIdWithProvider(id: string, ctx?: OperationContext): Promise<PromotionConnection | null>;
    findInstanceConnection(ctx?: OperationContext): Promise<PromotionConnection | null>;
    insertConnection(connection: NewPromotionConnection, ctx?: OperationContext): Promise<PromotionConnection>;
    renameConnection(id: string, name: string): Promise<void>;
    updateConnection(id: string, expectedProviderId: string, changes: Partial<Pick<PromotionConnection, 'name' | 'providerId' | 'target'>>): Promise<boolean>;
    deleteConnection(id: string): Promise<void>;
    countByProviderId(providerId: string): Promise<number>;
    listConnections(options: {
        offset: number;
        limit: number;
        filter: PromotionConnectionFilter;
    }): Promise<{
        count: number;
        data: PromotionConnection[];
    }>;
}
export {};
