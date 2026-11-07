import type { CustomFetch } from '@n8n/backend-network';
import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import type { OauthService } from '../../oauth/oauth.service';
import { type AuthFetchDomainPolicy } from '../../utils/auth-fetch';
export declare function resolveMcpAuthDomainPolicy(authentication: string, credentialData: ICredentialDataDecryptedObject, mcpHostname: string | undefined): AuthFetchDomainPolicy | undefined;
export declare function createMcpAuthFetch({ allowedDomains, authentication, baseFetch, credentialData, credentialId, initialHeaders, oauthService, projectId, }: {
    allowedDomains?: AuthFetchDomainPolicy;
    authentication: string;
    baseFetch: CustomFetch;
    credentialData: ICredentialDataDecryptedObject;
    credentialId?: string;
    initialHeaders: Record<string, string>;
    oauthService: OauthService;
    projectId: string | null;
}): CustomFetch;
