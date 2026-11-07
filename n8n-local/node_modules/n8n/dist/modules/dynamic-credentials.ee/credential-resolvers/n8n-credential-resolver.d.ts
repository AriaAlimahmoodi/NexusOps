import { Logger } from '@n8n/backend-common';
import { CredentialResolverConfiguration, CredentialResolverHandle, ICredentialResolver } from '@n8n/decorators';
import { Cipher } from 'n8n-core';
import { ICredentialContext, ICredentialDataDecryptedObject } from 'n8n-workflow';
import { N8NIdentifier } from './identifiers/n8n-identifier';
import { DynamicCredentialUserEntryStorage } from './storage/dynamic-credential-user-entry-storage';
export declare class N8NCredentialResolver implements ICredentialResolver {
    private readonly logger;
    private readonly n8nIdentifier;
    private readonly storage;
    private readonly cipher;
    constructor(logger: Logger, n8nIdentifier: N8NIdentifier, storage: DynamicCredentialUserEntryStorage, cipher: Cipher);
    metadata: {
        name: string;
        description: string;
        displayName: string;
        options: never[];
    };
    getSecret(credentialId: string, context: ICredentialContext, handle: CredentialResolverHandle, executionId?: string): Promise<ICredentialDataDecryptedObject>;
    setSecret(credentialId: string, context: ICredentialContext, data: ICredentialDataDecryptedObject, handle: CredentialResolverHandle, executionId?: string): Promise<void>;
    deleteSecret(credentialId: string, context: ICredentialContext, handle: CredentialResolverHandle, executionId?: string): Promise<void>;
    deleteAllSecrets(handle: CredentialResolverHandle): Promise<void>;
    validateOptions(configuration: CredentialResolverConfiguration): Promise<void>;
    private resolveIdentifier;
    resolveOwningUserId(context: ICredentialContext, handle: CredentialResolverHandle, executionId?: string): Promise<string>;
    validateIdentity(context: ICredentialContext, handle: CredentialResolverHandle, executionId?: string): Promise<void>;
}
