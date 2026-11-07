import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import type { ResolvedSourceKeys } from '../../token-exchange.schemas';
import { TrustedKeySourceEntity } from '../entities/trusted-key-source.entity';
export declare class TrustedKeySourceRepository extends BaseRepository<TrustedKeySourceEntity> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    refreshSource(sourceId: string, resolveKeys: (source: TrustedKeySourceEntity) => Promise<ResolvedSourceKeys | undefined>, ctx: OperationContext): Promise<void>;
    private storeResolvedKeys;
}
