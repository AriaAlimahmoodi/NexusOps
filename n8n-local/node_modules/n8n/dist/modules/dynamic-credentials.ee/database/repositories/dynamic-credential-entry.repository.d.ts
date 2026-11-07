import { DataSource, Repository } from '@n8n/typeorm';
import { DynamicCredentialEntry } from '../entities/dynamic-credential-entry';
export declare class DynamicCredentialEntryRepository extends Repository<DynamicCredentialEntry> {
    constructor(dataSource: DataSource);
}
