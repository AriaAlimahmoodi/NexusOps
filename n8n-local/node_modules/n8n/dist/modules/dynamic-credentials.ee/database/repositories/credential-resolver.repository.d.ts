import { DataSource, Repository } from '@n8n/typeorm';
import { DynamicCredentialResolver } from '../entities/credential-resolver';
export declare class DynamicCredentialResolverRepository extends Repository<DynamicCredentialResolver> {
    constructor(dataSource: DataSource);
}
