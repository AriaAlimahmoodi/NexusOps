import type { CredentialOptionsRequestDto } from '@n8n/api-types';
import { CredentialsFinderService } from '@n8n/backend-services';
import type { User } from '@n8n/db';
import { CredentialTypes } from '../credential-types';
import { CredentialsHelper } from '../credentials-helper';
import { ExternalSecretsConfig } from '../modules/external-secrets.ee/external-secrets.config';
import { SecretsProviderAccessCheckService } from '../modules/external-secrets.ee/secret-provider-access-check.service.ee';
import { CredentialsService } from './credentials.service';
export declare class CredentialOptionsService {
    private readonly credentialTypes;
    private readonly credentialsHelper;
    private readonly credentialsService;
    private readonly credentialsFinder;
    private readonly externalSecretsConfig;
    private readonly secretProviderAccess;
    constructor(credentialTypes: CredentialTypes, credentialsHelper: CredentialsHelper, credentialsService: CredentialsService, credentialsFinder: CredentialsFinderService, externalSecretsConfig: ExternalSecretsConfig, secretProviderAccess: SecretsProviderAccessCheckService);
    lookupDraft(user: User, request: CredentialOptionsRequestDto, projectId: string | null): Promise<import("n8n-workflow").INodeListSearchResult>;
    lookupStored(user: User, credentialId: string, request: CredentialOptionsRequestDto): Promise<import("n8n-workflow").INodeListSearchResult>;
    private validateExternalSecrets;
    private load;
}
