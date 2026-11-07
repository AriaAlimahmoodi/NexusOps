import { type AgentModelCredentialConfig } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { CredentialsService } from '../../credentials/credentials.service';
import { AiGatewayService } from '../../services/ai-gateway.service';
import { BuilderModelLiveLookupService } from './builder/builder-model-live-lookup.service';
export declare class AgentDefaultModelResolverService {
    private readonly credentialsService;
    private readonly modelLookupService;
    private readonly aiGatewayService;
    constructor(credentialsService: CredentialsService, modelLookupService: BuilderModelLiveLookupService, aiGatewayService: AiGatewayService);
    resolve(user: User, projectId: string): Promise<AgentModelCredentialConfig | null>;
    resolveFromVerifiedModelIds(provider: string, credentialId: string, verifiedModelIds: readonly string[]): AgentModelCredentialConfig | null;
    private findProviderDefault;
    private resolveManagedOpenAi;
    private resolveCredential;
}
