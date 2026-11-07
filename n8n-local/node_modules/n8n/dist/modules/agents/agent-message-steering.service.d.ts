import type { AgentInputBoundary } from '@n8n/agents';
import { TransactionRunner, type OperationContext } from '@n8n/db';
import { AgentExecutionService } from './agent-execution.service';
import { AgentExecutionUpdateBroadcaster } from './agent-execution-update-broadcaster';
import type { AgentExecutionThread } from './entities/agent-execution-thread.entity';
import { type ExecutionRecorder } from './execution-recorder';
import { N8NCheckpointStorage } from './integrations/n8n-checkpoint-storage';
import { AgentExecutionRepository } from './repositories/agent-execution.repository';
import { AgentExecutionThreadRepository } from './repositories/agent-execution-thread.repository';
import { AgentMessageQueueRepository } from './repositories/agent-message-queue.repository';
import { AgentMessageRepository } from './repositories/agent-message.repository';
import type { SteeringConsumption } from './types/agent-steering';
interface SteeringContext {
    agentId: string;
    projectId: string;
    threadId: string;
    executionId: string;
    resourceId: string;
}
export declare class AgentMessageSteeringService {
    private readonly txRunner;
    private readonly queue;
    private readonly threads;
    private readonly executions;
    private readonly messages;
    private readonly checkpoints;
    private readonly executionService;
    private readonly updates;
    constructor(txRunner: TransactionRunner, queue: AgentMessageQueueRepository, threads: AgentExecutionThreadRepository, executions: AgentExecutionRepository, messages: AgentMessageRepository, checkpoints: N8NCheckpointStorage, executionService: AgentExecutionService, updates: AgentExecutionUpdateBroadcaster);
    findEligible(thread: AgentExecutionThread, ctx?: OperationContext): Promise<import("./entities/agent-execution.entity").AgentExecution | null>;
    close(threadId: string, executionId: string): Promise<void>;
    release(threadId: string, executionId: string, ctx: OperationContext): Promise<boolean>;
    releaseInactive(thread: AgentExecutionThread, ctx: OperationContext): Promise<boolean>;
    consume(context: SteeringContext, boundary: AgentInputBoundary, recorder: ExecutionRecorder, signal: AbortSignal): Promise<SteeringConsumption>;
    private isIdleSteerableRun;
    private consumeLocked;
    private prepareInput;
    private restoreCommittedInputs;
}
export {};
