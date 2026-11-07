import type { CredentialProvider, ResolvedCredential, CredentialListItem } from '@n8n/agents';
import type { User } from '@n8n/db';
import type { CredentialsService } from '../../../credentials/credentials.service';
import type { AiGatewayModelCredentialResolver } from '../json-config/model-config';
import type { AiGatewaySearchCredentialResolver } from '../json-config/web-search-credential';
export declare class AgentsCredentialProvider implements CredentialProvider, AiGatewayModelCredentialResolver, AiGatewaySearchCredentialResolver {
    private readonly credentialsService;
    private readonly projectId;
    private readonly user?;
    private readonly agentId?;
    constructor(credentialsService: CredentialsService, projectId: string, user?: User | undefined, agentId?: string | undefined);
    resolveAiGatewayModelCredential(provider: string): Promise<ResolvedCredential>;
    resolveAiGatewaySearchCredential(credentialType: string): Promise<ResolvedCredential>;
    private mintGatewayCredential;
    resolve(credentialId: string): Promise<ResolvedCredential>;
    list(): Promise<CredentialListItem[]>;
    private findCredentialEntity;
    private getUserAccessibleCredentials;
    private getAllProjectAndGlobalCredentials;
}
