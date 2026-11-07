import type { CredentialsEntity } from '@n8n/db';
import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import type { CredentialsHelper } from '../../../credentials-helper';
export declare function decryptAgentCredential(credentialsHelper: CredentialsHelper, credential: Pick<CredentialsEntity, 'id' | 'name' | 'type'>, scope: {
    projectId: string;
    userId?: string;
}): Promise<ICredentialDataDecryptedObject>;
