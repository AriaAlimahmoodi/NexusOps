import type { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import type { CredentialsService } from '../../credentials/credentials.service';
import type { AgentConfigService } from '../../modules/agents/agent-config.service';
type FixSuggestionDependencies = {
    agentConfigService: AgentConfigService;
    credentialsService: CredentialsService;
    logger: Logger;
};
type FixSuggestionSubject = {
    input: string;
    output: string;
    rule: string;
    reasoning: string | null;
};
export declare function generateFixSuggestion({ agentConfigService, credentialsService, logger }: FixSuggestionDependencies, subject: FixSuggestionSubject, ctx: {
    agentId: string;
    projectId: string;
    user: User;
}): Promise<string | null>;
export {};
