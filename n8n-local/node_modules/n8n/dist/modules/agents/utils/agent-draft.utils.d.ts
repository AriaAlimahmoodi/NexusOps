import type { OperationContext } from '@n8n/db';
import type { Agent } from '../entities/agent.entity';
import type { AgentRepository } from '../repositories/agent.repository';
export declare function markAgentDraftDirty(agent: Agent): void;
export declare function saveAgentDraftFenced(agentRepository: AgentRepository, agent: Agent, ctx?: OperationContext): Promise<Agent>;
