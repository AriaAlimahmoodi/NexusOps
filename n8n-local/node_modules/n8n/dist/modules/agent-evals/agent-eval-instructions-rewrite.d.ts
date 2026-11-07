import type { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import type { CredentialsService } from '../../credentials/credentials.service';
import type { AgentConfigService } from '../../modules/agents/agent-config.service';
type RewriteDependencies = {
    agentConfigService: AgentConfigService;
    credentialsService: CredentialsService;
    logger: Logger;
};
type RewriteSubject = {
    currentInstructions: string;
    suggestions: Array<{
        suggestion: string;
        rule: string | null;
    }>;
};
export declare function rewriteAgentInstructions({ agentConfigService, credentialsService, logger }: RewriteDependencies, subject: RewriteSubject, ctx: {
    agentId: string;
    projectId: string;
    user: User;
}): Promise<string>;
export {};
