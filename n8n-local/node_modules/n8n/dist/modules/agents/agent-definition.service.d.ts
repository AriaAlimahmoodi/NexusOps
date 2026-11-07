import { TransactionRunner, type OperationContext } from '@n8n/db';
import { AgentSkillRefsService } from './agent-skill-refs.service';
import type { AgentHistory } from './entities/agent-history.entity';
import type { Agent } from './entities/agent.entity';
import { AgentTaskSnapshotRepository } from './repositories/agent-task-snapshot.repository';
import { AgentTaskRepository } from './repositories/agent-task.repository';
import { AgentRepository } from './repositories/agent.repository';
import { type AgentDefinition, type PendingSkillRefs } from './utils/agent-definition';
export declare class AgentDefinitionService {
    private readonly taskRepository;
    private readonly taskSnapshotRepository;
    private readonly agentRepository;
    private readonly transactionRunner;
    private readonly agentSkillRefs;
    constructor(taskRepository: AgentTaskRepository, taskSnapshotRepository: AgentTaskSnapshotRepository, agentRepository: AgentRepository, transactionRunner: TransactionRunner, agentSkillRefs: AgentSkillRefsService);
    readDraft(agent: Agent, ctx?: OperationContext, pending?: PendingSkillRefs): Promise<AgentDefinition>;
    readVersion(version: AgentHistory, ctx?: OperationContext): Promise<AgentDefinition>;
    replaceDraft(agent: Agent, definition: AgentDefinition, ctx?: OperationContext, skillPinsFrom?: Pick<AgentHistory, 'versionId' | 'skills'>): Promise<boolean>;
}
