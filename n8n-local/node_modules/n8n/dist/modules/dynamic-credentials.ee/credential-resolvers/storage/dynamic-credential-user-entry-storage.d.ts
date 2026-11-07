import { CredentialResolverHandle } from '@n8n/decorators';
import { ICredentialEntriesStorage } from './storage-interface';
import { DynamicCredentialUserEntryRepository } from '../../database/repositories/dynamic-credential-user-entry.repository';
export declare class DynamicCredentialUserEntryStorage implements ICredentialEntriesStorage {
    private readonly dynamicCredentialUserEntryRepository;
    constructor(dynamicCredentialUserEntryRepository: DynamicCredentialUserEntryRepository);
    getCredentialData(credentialId: string, userId: string, resolverId: string, _: Record<string, unknown>): Promise<string | null>;
    setCredentialData(credentialId: string, userId: string, resolverId: string, data: string, _: Record<string, unknown>): Promise<void>;
    deleteCredentialData(credentialId: string, userId: string, resolverId: string, _: Record<string, unknown>): Promise<void>;
    deleteAllCredentialData(handle: CredentialResolverHandle): Promise<void>;
}
