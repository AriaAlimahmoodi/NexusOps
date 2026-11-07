import { ModuleRegistry } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { InstanceAiMemoryService } from './instance-ai-memory.service';
export declare class InstanceAiPendingAgentService {
    private readonly memoryService;
    private readonly moduleRegistry;
    constructor(memoryService: InstanceAiMemoryService, moduleRegistry: ModuleRegistry);
    private agentsModule;
    persistAndBind(user: User, threadId: string, { projectId, agentId, name }: {
        projectId: string;
        agentId: string;
        name: string;
    }): Promise<{
        agent: import("../agents/entities/agent.entity").Agent & {
            isRunnable: boolean;
            hasPublishHistory: boolean;
            configHash: string | null;
            skills: Record<string, import("@n8n/api-types").AgentSkill>;
            skillHashes: Record<string, string>;
            outdatedSkillIds: string[];
        };
        thread: import("@n8n/api-types").InstanceAiThreadInfo;
    }>;
    private createAgent;
    private mayAdopt;
    private assertMayWrite;
}
