import { ChatHubLLMProvider } from '@n8n/api-types';
import { ProjectRepository, SharedWorkflowRepository, User } from '@n8n/db';
import { EntityManager } from '@n8n/typeorm';
import type { INodeCredentials } from 'n8n-workflow';
import { CredentialsFinderService } from '@n8n/backend-services';
import { CredentialsService } from '../../credentials/credentials.service';
export declare class ChatHubCredentialsService {
    private readonly credentialsService;
    private readonly sharedWorkflowRepository;
    private readonly credentialsFinderService;
    private readonly projectRepository;
    constructor(credentialsService: CredentialsService, sharedWorkflowRepository: SharedWorkflowRepository, credentialsFinderService: CredentialsFinderService, projectRepository: ProjectRepository);
    ensureCredentialAccess(user: User, credentialId: string): Promise<import("@n8n/db").CredentialsEntity>;
    private pickCredentialId;
    findPersonalProject(user: User, trx?: EntityManager): Promise<import("@n8n/db").Project>;
    findProviderCredential(provider: ChatHubLLMProvider, credentials: INodeCredentials): string;
    findWorkflowCredentialAndProject(provider: ChatHubLLMProvider, credentials: INodeCredentials, workflowId: string): Promise<{
        credentialId: string;
        projectId: string;
    }>;
}
