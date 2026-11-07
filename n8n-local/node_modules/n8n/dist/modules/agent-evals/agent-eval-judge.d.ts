import type { AgentEvalVerdict } from '@n8n/api-types';
import type { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import type { CredentialsService } from '../../credentials/credentials.service';
import type { AgentConfigService } from '../../modules/agents/agent-config.service';
type JudgeDependencies = {
    agentConfigService: AgentConfigService;
    credentialsService: CredentialsService;
    logger: Logger;
};
type JudgeSubject = {
    input: string;
    output: string;
    criteria: string | null;
    expectedOutput: string | null;
};
export declare function judgeAgentAnswer({ agentConfigService, credentialsService, logger }: JudgeDependencies, { input, output, criteria, expectedOutput }: JudgeSubject, ctx: {
    agentId: string;
    projectId: string;
    user: User;
}): Promise<AgentEvalVerdict>;
export {};
