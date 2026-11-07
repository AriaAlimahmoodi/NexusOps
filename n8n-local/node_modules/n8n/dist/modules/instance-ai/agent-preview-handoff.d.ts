import type { InstanceAiAgentPreviewHandoffContext } from '@n8n/api-types';
import type { AgentExecutionService } from '../agents/agent-execution.service';
export type AgentPreviewHandoffResult = {
    block: string;
    titleFallback: string;
    target: {
        agentId: string;
        projectId: string;
    };
};
export declare function resolveAgentPreviewHandoff(context: InstanceAiAgentPreviewHandoffContext, options: {
    projectId: string;
    userId: string;
    getThreadDetail: AgentExecutionService['getThreadDetail'];
}): Promise<AgentPreviewHandoffResult>;
