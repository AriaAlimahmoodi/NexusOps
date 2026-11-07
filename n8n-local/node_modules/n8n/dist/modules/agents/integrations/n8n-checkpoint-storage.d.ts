import { type CheckpointStore, type SerializableAgentState } from '@n8n/agents';
import { Logger } from '@n8n/backend-common';
import { AgentsConfig } from '@n8n/config';
import { TransactionRunner, type OperationContext } from '@n8n/db';
import { type AgentSandboxPrincipalHash } from '../agent-sandbox-principal';
import { AgentCheckpointRepository } from '../repositories/agent-checkpoint.repository';
import { AgentExecutionRepository } from '../repositories/agent-execution.repository';
import { AgentExecutionThreadRepository } from '../repositories/agent-execution-thread.repository';
import { AgentMessageQueueRepository } from '../repositories/agent-message-queue.repository';
type CheckpointStatus = {
    status: 'expired';
    checkpoint?: SerializableAgentState;
} | {
    status: 'not-found';
} | {
    status: 'active';
    checkpoint: SerializableAgentState;
};
export declare const CHECKPOINT_RECONCILIATION_OVERFLOW: unique symbol;
export declare class N8NCheckpointStorage {
    private readonly agentCheckpointRepository;
    private readonly logger;
    private readonly agentsConfig;
    private readonly txRunner;
    private readonly executionRepository;
    private readonly threadRepository;
    private readonly queueRepository;
    constructor(agentCheckpointRepository: AgentCheckpointRepository, logger: Logger, agentsConfig: AgentsConfig, txRunner: TransactionRunner, executionRepository: AgentExecutionRepository, threadRepository: AgentExecutionThreadRepository, queueRepository: AgentMessageQueueRepository);
    getStorage(agentId: string): CheckpointStore;
    getActiveRunIdsForSandbox(agentId: string, principalHash: AgentSandboxPrincipalHash): Promise<Set<string> | typeof CHECKPOINT_RECONCILIATION_OVERFLOW>;
    save(key: string, checkpointState: SerializableAgentState, agentId: string): Promise<void>;
    private withExecutionOwnership;
    private expiryCutoff;
    load(key: string, agentId: string): Promise<SerializableAgentState | undefined>;
    claimForResume(key: string, checkpointState: SerializableAgentState, agentId: string): Promise<boolean>;
    cancelSuspended(key: string, state: SerializableAgentState, agentId: string): Promise<boolean>;
    findSuspendedForThread(agentId: string, threadId: string, ctx?: OperationContext): Promise<SerializableAgentState | null>;
    hasNoConflictingThreadResource(agentId: string, threadId: string, resourceId: string): Promise<boolean>;
    findDelegatedSuspensionForThread(agentId: string, threadId: string): Promise<{
        runId: string;
        checkpoint: SerializableAgentState;
        serializedState: string;
        updatedAt: Date;
        expiresAt: Date;
    } | undefined>;
    deleteDelegatedForThread(agentId: string, threadId: string): Promise<void>;
    markUserPaused(agentId: string, suspension: {
        runId: string;
        checkpoint: SerializableAgentState;
        serializedState: string;
        updatedAt: Date;
    }): Promise<boolean>;
    private deleteDelegation;
    private parseSuspendedState;
    getStatus(key: string, agentId: string, ctx?: OperationContext): Promise<CheckpointStatus>;
    delete(key: string, agentId: string): Promise<void>;
    pruneStaleSuspensions(): Promise<void>;
}
export {};
