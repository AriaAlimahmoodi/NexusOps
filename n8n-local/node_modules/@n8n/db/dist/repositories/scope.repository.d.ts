import { Logger } from '@n8n/backend-common';
import { DataSource, Repository } from '@n8n/typeorm';
import { Scope } from '../entities';
export declare class ScopeRepository extends Repository<Scope> {
    private readonly logger;
    constructor(dataSource: DataSource, logger: Logger);
    findByList(slugs: string[]): Promise<Scope[]>;
    findByListOrFail(slugs: string[]): Promise<Scope[]>;
}
