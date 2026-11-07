import { Logger } from '@n8n/backend-common';
import { ProjectRelationRepository, RoleRepository, SharedCredentialsRepository, UserRepository } from '@n8n/db';
import type { EntityManager } from '@n8n/typeorm';
import { Cipher } from 'n8n-core';
import type { ICredentialConnectionStatusProvider, UserConnection } from '../../../credentials/credential-connection-status-provider.interface';
import { RoleService } from '@n8n/backend-services';
import { DynamicCredentialUserEntryRepository } from '../database/repositories/dynamic-credential-user-entry.repository';
export declare class CredentialConnectionStatusService implements ICredentialConnectionStatusProvider {
    private readonly repository;
    private readonly userRepository;
    private readonly sharedCredentialsRepository;
    private readonly roleService;
    private readonly projectRelationRepository;
    private readonly cipher;
    private readonly logger;
    private readonly roleRepository;
    constructor(repository: DynamicCredentialUserEntryRepository, userRepository: UserRepository, sharedCredentialsRepository: SharedCredentialsRepository, roleService: RoleService, projectRelationRepository: ProjectRelationRepository, cipher: Cipher, logger: Logger, roleRepository: RoleRepository);
    findMyConnections(userId: string, credentialIds: string[]): Promise<Map<string, UserConnection>>;
    private readAccountIdentifier;
    deleteMyConnection(userId: string, credentialId: string): Promise<number>;
    countConnectedUsers(credentialId: string): Promise<number>;
    deleteAllUserEntries(credentialId: string, em?: EntityManager): Promise<void>;
    cleanupOrphanedEntriesForUsers(userIds: string[], em?: EntityManager, credentialId?: string): Promise<void>;
    cleanupOrphanedEntriesForProjects(credentialId: string, projectIds: string[], em?: EntityManager): Promise<void>;
    private deleteOrphanedPairs;
    private selectOrphanedPairs;
}
