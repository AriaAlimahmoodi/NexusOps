import type { SerializableAgentState } from '@n8n/agents';
import { N8NCheckpointStorage } from './integrations/n8n-checkpoint-storage';
import { AgentExecutionRepository } from './repositories/agent-execution.repository';
export declare class AgentConversationStateService {
    private readonly executionRepository;
    private readonly checkpointStorage;
    constructor(executionRepository: AgentExecutionRepository, checkpointStorage: N8NCheckpointStorage);
    inspect(agentId: string, threadId: string): Promise<{
        running: boolean;
        suspendedCheckpoint: SerializableAgentState | null;
    }>;
    isResumable(agentId: string, runId: string): Promise<boolean>;
}
