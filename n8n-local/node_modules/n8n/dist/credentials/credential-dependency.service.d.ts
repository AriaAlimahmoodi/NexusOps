import type { CredentialDependencyType } from '@n8n/db';
import { CredentialDependencyRepository, SecretsProviderConnectionRepository } from '@n8n/db';
import { type EntityManager } from '@n8n/typeorm';
import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
export { EXTERNAL_SECRET_PROVIDER_DEPENDENCY_TYPE } from '@n8n/db';
export type CredentialDependencyFilter = {
    dependencyType: CredentialDependencyType;
    dependencyId: string;
};
export declare class CredentialDependencyService {
    private readonly credentialDependencyRepository;
    private readonly secretsProviderConnectionRepository;
    constructor(credentialDependencyRepository: CredentialDependencyRepository, secretsProviderConnectionRepository: SecretsProviderConnectionRepository);
    resolveExternalSecretsStoreDependencyFilter(externalSecretsStoreProviderKey: string): Promise<CredentialDependencyFilter | undefined>;
    resolveProviderIdsFromCredentialData(decryptedCredentialData: ICredentialDataDecryptedObject, entityManager?: EntityManager): Promise<string[]>;
    upsertExternalSecretProviderDependenciesForCredential({ credentialId, decryptedCredentialData, entityManager, }: {
        credentialId: string;
        decryptedCredentialData: ICredentialDataDecryptedObject;
        entityManager: EntityManager;
    }): Promise<void>;
    syncExternalSecretProviderDependenciesForCredential({ credentialId, decryptedCredentialData, entityManager, }: {
        credentialId: string;
        decryptedCredentialData: ICredentialDataDecryptedObject;
        entityManager: EntityManager;
    }): Promise<void>;
    deleteDependencyById({ dependencyType, dependencyId, entityManager, }: {
        dependencyType: CredentialDependencyType;
        dependencyId: string;
        entityManager?: EntityManager;
    }): Promise<void>;
    deleteDependenciesByIds({ dependencyType, dependencyIds, entityManager, }: {
        dependencyType: CredentialDependencyType;
        dependencyIds: string[];
        entityManager?: EntityManager;
    }): Promise<void>;
}
