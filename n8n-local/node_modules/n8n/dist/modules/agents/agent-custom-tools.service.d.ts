import { type ToolDescriptor } from '@n8n/agents';
import { type StoredAgentConfig } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { type AgentMutationTelemetryContext } from './agent-modification-telemetry.service';
import { AgentSaveCompletionService } from './agent-save-completion.service';
import { AgentSkillRefsService } from './agent-skill-refs.service';
import type { Agent } from './entities/agent.entity';
import { AgentRepository } from './repositories/agent.repository';
type AgentToolEntries = Agent['tools'];
export declare class AgentCustomToolsService {
    private readonly logger;
    private readonly agentRepository;
    private readonly saveCompletion;
    private readonly agentSkillRefs;
    constructor(logger: Logger, agentRepository: AgentRepository, saveCompletion: AgentSaveCompletionService, agentSkillRefs: AgentSkillRefsService);
    buildCustomTool(agentId: string, projectId: string, code: string, descriptor: ToolDescriptor, context: AgentMutationTelemetryContext, options?: {
        recordTelemetry?: boolean;
    }): Promise<{
        ok: boolean;
        id: string;
        descriptor: ToolDescriptor;
        changed: boolean;
    }>;
    deleteCustomTool(agentId: string, projectId: string, toolId: string, context: AgentMutationTelemetryContext): Promise<void>;
    private getMissingCustomToolIds;
    snapshotConfiguredTools(config: StoredAgentConfig | null, tools: AgentToolEntries): AgentToolEntries | null;
    private saveToolChanges;
}
export {};
