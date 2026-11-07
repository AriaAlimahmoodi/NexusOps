import { BaseRepository, type OperationContext, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { PromotionProvider } from '../entities/promotion-provider.entity';
type NewPromotionProvider = Pick<PromotionProvider, 'name' | 'type' | 'authType' | 'config' | 'auth'>;
export declare class PromotionProviderRepository extends BaseRepository<PromotionProvider> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    findById(id: string, ctx?: OperationContext): Promise<PromotionProvider | null>;
    insertProvider(provider: NewPromotionProvider): Promise<PromotionProvider>;
    updateProvider(id: string, changes: Partial<Pick<PromotionProvider, 'name' | 'config' | 'auth'>>): Promise<void>;
    updateProviderIfUnchanged(id: string, expected: Pick<PromotionProvider, 'config' | 'auth'>, changes: Partial<Pick<PromotionProvider, 'name' | 'config' | 'auth'>>): Promise<boolean>;
    deleteProvider(id: string): Promise<void>;
    listProviders(options: {
        offset: number;
        limit: number;
    }): Promise<{
        count: number;
        data: PromotionProvider[];
    }>;
}
export {};
