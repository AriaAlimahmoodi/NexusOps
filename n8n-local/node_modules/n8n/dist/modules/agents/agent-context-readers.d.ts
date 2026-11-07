import type { AgentSkillsService } from './agent-skills.service';
import type { AgentTaskService } from './agent-task.service';
import type { Agent } from './entities/agent.entity';
export declare function readAgentSkill(agentSkillsService: AgentSkillsService, agentId: string, projectId: string, skillId: string, referencePaths?: string[]): Promise<{
    id: string;
    skillHash: string;
    skill: {
        name: string;
        description: string;
        instructions: string;
        allowedTools?: string[];
        references?: {
            path: string;
            characterCount: number;
            content?: string | undefined;
        }[] | undefined;
    };
}>;
export declare function listAgentTasks(agentTaskService: AgentTaskService, agent: Agent): Promise<{
    name: string;
    objective: string;
    cronExpression: string;
    timezone?: string | null | undefined;
    id: string;
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
}[]>;
