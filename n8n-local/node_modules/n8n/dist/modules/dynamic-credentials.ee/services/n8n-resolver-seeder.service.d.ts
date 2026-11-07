import { Logger } from '@n8n/backend-common';
import { Cipher } from 'n8n-core';
import { DynamicCredentialResolverRegistry } from './credential-resolver-registry.service';
import { DynamicCredentialResolver } from '../database/entities/credential-resolver';
import { DynamicCredentialResolverRepository } from '../database/repositories/credential-resolver.repository';
export declare class N8nResolverSeeder {
    private readonly repository;
    private readonly cipher;
    private readonly registry;
    private readonly logger;
    constructor(repository: DynamicCredentialResolverRepository, cipher: Cipher, registry: DynamicCredentialResolverRegistry, logger: Logger);
    seed(): Promise<DynamicCredentialResolver | undefined>;
}
