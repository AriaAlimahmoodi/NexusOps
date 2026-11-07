import { LockService } from '@n8n/backend-common';
import { InstanceSettings } from 'n8n-core';
import type { PubSubCommandMap } from '../../scaling/pubsub/pubsub.event-map';
import { Publisher } from '../../scaling/pubsub/publisher.service';
import { AgentExecutionService } from './agent-execution.service';
import { AgentMessageSteeringService } from './agent-message-steering.service';
import { AgentExecutionUpdateBroadcaster } from './agent-execution-update-broadcaster';
import { AgentBackgroundJobService } from './background/agent-background-job.service';
import { N8NCheckpointStorage } from './integrations/n8n-checkpoint-storage';
import { AgentExecutionRepository } from './repositories/agent-execution.repository';
import { type AgentChatSurface } from './utils/agent-thread-access';
type CancelExecutionPayload = PubSubCommandMap['cancel-agent-chat-execution'];
type ExecutionContext = Omit<CancelExecutionPayload, 'productionN8nChat' | 'surface'> & {
    surface: AgentChatSurface;
};
export interface CancelSuspendedRunParams {
    agentId: string;
    runId: string;
    resourceId: string;
    cancelBackgroundJobs?: boolean;
}
export { AgentTurnAlreadyRunningError } from './agent-turn-already-running.error';
export declare class AgentChatExecutionService {
    private readonly lockService;
    private readonly executionRepository;
    private readonly executionService;
    private readonly checkpointStorage;
    private readonly publisher;
    private readonly instanceSettings;
    private readonly executionUpdates;
    private readonly steering;
    private readonly backgroundJobService;
    private static readonly PENDING_CANCEL_TTL_MS;
    private readonly pendingCancellations;
    private readonly executions;
    constructor(lockService: LockService, executionRepository: AgentExecutionRepository, executionService: AgentExecutionService, checkpointStorage: N8NCheckpointStorage, publisher: Publisher, instanceSettings: InstanceSettings, executionUpdates: AgentExecutionUpdateBroadcaster, steering: AgentMessageSteeringService, backgroundJobService: AgentBackgroundJobService);
    register(context: ExecutionContext, controller: AbortController): void;
    settle(executionId: string, finalize: () => Promise<void>, suspendedRunId?: string): Promise<void>;
    private release;
    requestCancel(context: ExecutionContext): Promise<boolean>;
    handleCancel(payload: CancelExecutionPayload): Promise<void>;
    private cancelLocalWithChildren;
    private cancelOrRemember;
    private cancelLocal;
    private getOwnedExecution;
    private canAccessExecution;
    private cancelRecordedSuspension;
    cancelSuspended(params: CancelSuspendedRunParams): Promise<boolean>;
}
