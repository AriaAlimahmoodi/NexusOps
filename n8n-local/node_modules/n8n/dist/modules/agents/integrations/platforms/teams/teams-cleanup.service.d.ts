import type { AgentIntegrationDisconnectWarning } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { AgentCredentialLookupService } from '../../agent-credential-lookup.service';
export interface TeamsCleanupContext {
    user: User;
    projectId: string;
    credentialId: string;
}
export declare class TeamsCleanupService {
    private readonly credentialLookup;
    constructor(credentialLookup: AgentCredentialLookupService);
    describeLeftovers(ctx: TeamsCleanupContext): Promise<AgentIntegrationDisconnectWarning | undefined>;
}
