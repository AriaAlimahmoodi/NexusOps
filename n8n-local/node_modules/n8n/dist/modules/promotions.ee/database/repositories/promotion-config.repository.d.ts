import type { PromotionConfigSettings, PromotionDirection } from '@n8n/api-types';
import { BaseRepository, type OperationContext, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { PromotionConfig } from '../entities/promotion-config.entity';
type NewPromotionConfig = Pick<PromotionConfig, 'connectionId' | 'name' | 'direction' | 'settings'>;
export declare class PromotionConfigRepository extends BaseRepository<PromotionConfig> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    findResolved(connectionId: string, direction: PromotionDirection, ctx?: OperationContext): Promise<PromotionConfig | null>;
    findById(id: string, ctx?: OperationContext): Promise<PromotionConfig | null>;
    findByConnectionAndDirection(connectionId: string, direction: PromotionDirection, ctx?: OperationContext): Promise<PromotionConfig | null>;
    findByConnectionIds(connectionIds: string[], ctx?: OperationContext): Promise<PromotionConfig[]>;
    insertConfig(config: NewPromotionConfig, ctx?: OperationContext): Promise<PromotionConfig>;
    replaceConfig(id: string, changes: {
        name: string;
        settings: PromotionConfigSettings;
    }, ctx?: OperationContext): Promise<void>;
    deleteConfig(id: string): Promise<void>;
}
export {};
