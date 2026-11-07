import type { User } from '@n8n/db';
import type { CredentialsService } from '../../../credentials/credentials.service';
import { AgentsCredentialProvider } from '../adapters/agents-credential-provider';
export declare function createAgentCredentialProvider(credentialsService: CredentialsService, projectId: string, user?: User, agentId?: string): AgentsCredentialProvider;
