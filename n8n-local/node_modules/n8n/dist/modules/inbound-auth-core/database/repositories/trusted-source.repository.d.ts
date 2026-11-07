import { DatabaseConfig } from '@n8n/config';
import { OperationContext, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { TrustedSourceEntity } from '../entities/trusted-source.entity';
export type NewTrustedSourceRow = Pick<TrustedSourceEntity, 'name' | 'type' | 'issuer' | 'managedBy' | 'status' | 'lastError' | 'lastCheckedAt' | 'configVersion' | 'config' | 'metadata'>;
export type TrustedSourceRowChanges = Partial<Pick<TrustedSourceEntity, 'name' | 'issuer' | 'configVersion' | 'config' | 'metadata' | 'status' | 'lastError' | 'lastCheckedAt' | 'discoveryClaimToken' | 'discoveryClaimedAt'>>;
export type DiscoveryRowChanges = Pick<TrustedSourceRowChanges, 'metadata' | 'status' | 'lastError'>;
export type DueQuery = {
    errorRetrySeconds: number;
    healthyRefreshSeconds: number;
    limit: number;
};
export declare class TrustedSourceRepository {
    private readonly table;
    private readonly isPostgres;
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner, config: DatabaseConfig);
    findById(id: string, ctx?: OperationContext): Promise<TrustedSourceEntity | null>;
    findByIssuer(issuer: string, ctx?: OperationContext): Promise<TrustedSourceEntity | null>;
    findAll(ctx?: OperationContext): Promise<TrustedSourceEntity[]>;
    findDue({ errorRetrySeconds, healthyRefreshSeconds, limit }: DueQuery, ctx?: OperationContext): Promise<TrustedSourceEntity[]>;
    insertRow(row: NewTrustedSourceRow, ctx?: OperationContext): Promise<TrustedSourceEntity>;
    insertIfAbsent(row: NewTrustedSourceRow & Pick<TrustedSourceEntity, 'id'>, ctx?: OperationContext): Promise<void>;
    updateById(id: string, changes: TrustedSourceRowChanges, ctx?: OperationContext): Promise<void>;
    deleteById(id: string, ctx?: OperationContext): Promise<void>;
    claimForDiscovery(id: string, token: string, leaseSeconds: number, ctx?: OperationContext): Promise<boolean>;
    recordDiscovery(id: string, token: string, changes: DiscoveryRowChanges, ctx?: OperationContext): Promise<boolean>;
}
