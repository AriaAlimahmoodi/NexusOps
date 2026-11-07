import type { ProjectAgent } from '../entities/agent.entity';
import type { AgentRepository } from '../repositories/agent.repository';
export declare function getAgentOrThrow(repository: AgentRepository, agentId: string, projectId: string, message?: string): Promise<ProjectAgent>;
