import type { EntityManager } from '@n8n/typeorm';
import { DataSource, Repository } from '@n8n/typeorm';
import { DynamicCredentialUserEntry } from '../entities/dynamic-credential-user-entry';
export declare class DynamicCredentialUserEntryRepository extends Repository<DynamicCredentialUserEntry> {
    constructor(dataSource: DataSource);
    deleteByPairs(pairs: Array<{
        credentialId: string;
        userId: string;
    }>, em: EntityManager): Promise<void>;
}
