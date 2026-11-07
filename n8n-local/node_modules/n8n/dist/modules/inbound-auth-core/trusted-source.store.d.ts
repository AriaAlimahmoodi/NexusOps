import { Logger } from '@n8n/backend-common';
import { TrustedSourceStore, type SurfaceId, type TrustedSource, type TrustedSourceConfigInput, type TrustedSourceMetadata, type TrustedSourceStatus } from '@n8n/inbound-auth';
import { Cipher } from 'n8n-core';
import { UserError } from 'n8n-workflow';
import { TrustedSourceIdentityRepository } from './database/repositories/trusted-source-identity.repository';
import { TrustedSourceRepository } from './database/repositories/trusted-source.repository';
import { TransactionRunner } from '@n8n/db';
import { CacheService } from '@n8n/backend-services';
export type CreateTrustedSourceInput = {
    name: string;
    issuer: string;
    config: TrustedSourceConfigInput;
};
export type UpdateTrustedSourceInput = Partial<CreateTrustedSourceInput>;
export type SeedSystemSourceInput = CreateTrustedSourceInput & {
    id: string;
};
export type SeedSystemSourceOutcome = 'inserted' | 'issuer-updated' | 'unchanged' | 'conflict';
export declare class SystemTrustedSourceModificationError extends UserError {
    constructor(action: 'update' | 'delete');
}
export declare const ERROR_RETRY_SECONDS: number;
export declare const HEALTHY_REFRESH_SECONDS: number;
export type DiscoveryResult = {
    metadata?: TrustedSourceMetadata;
    status: TrustedSourceStatus;
    lastError: string | null;
};
export declare class TrustedSourceDbStore extends TrustedSourceStore {
    private readonly logger;
    private readonly trustedSourceRepository;
    private readonly cipher;
    private readonly cacheService;
    private readonly trustedSourceIdentityRepository;
    private readonly transactionRunner;
    constructor(logger: Logger, trustedSourceRepository: TrustedSourceRepository, cipher: Cipher, cacheService: CacheService, trustedSourceIdentityRepository: TrustedSourceIdentityRepository, transactionRunner: TransactionRunner);
    getById(id: string): Promise<TrustedSource | undefined>;
    getByIssuer(issuer: string): Promise<TrustedSource | undefined>;
    listAll(): Promise<TrustedSource[]>;
    listBySurface(surface: SurfaceId): Promise<TrustedSource[]>;
    listDue(limit: number): Promise<TrustedSource[]>;
    claimDiscovery(source: TrustedSource): Promise<string | null>;
    recordDiscovery(source: TrustedSource, token: string, result: DiscoveryResult): Promise<boolean>;
    create(input: CreateTrustedSourceInput): Promise<TrustedSource>;
    update(id: string, input: UpdateTrustedSourceInput, options?: {
        clearBindings: boolean;
    }): Promise<void>;
    delete(id: string): Promise<void>;
    seedSystemSource(input: SeedSystemSourceInput): Promise<SeedSystemSourceOutcome>;
    private loadAdminRow;
    private invalidateCache;
    private load;
    private loadAll;
    private toRuntime;
    private parseMetadata;
}
