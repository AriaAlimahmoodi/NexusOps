import type { User } from '@n8n/db';
import { type ICredentialDataDecryptedObject } from 'n8n-workflow';
import type { SecretsProviderAccessCheckService } from '../modules/external-secrets.ee/secret-provider-access-check.service.ee';
export declare function isChangingExternalSecretExpression(newData: ICredentialDataDecryptedObject, existingData: ICredentialDataDecryptedObject): boolean;
export declare function validateExternalSecretsPermissions({ user, projectId, dataToSave, decryptedExistingData, }: {
    user: User;
    projectId: string;
    dataToSave?: ICredentialDataDecryptedObject;
    decryptedExistingData?: ICredentialDataDecryptedObject;
}): Promise<void>;
export declare function validateAccessToReferencedSecretProviders(projectId: string, data: ICredentialDataDecryptedObject, externalSecretsProviderAccessCheckService: SecretsProviderAccessCheckService, source: 'create' | 'update' | 'transfer'): Promise<void>;
export declare function parseCredentialDescription(description: unknown): string | null;
