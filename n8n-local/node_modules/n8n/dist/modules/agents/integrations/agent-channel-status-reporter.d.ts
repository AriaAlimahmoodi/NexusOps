import { Logger } from '@n8n/backend-common';
import { AgentsConfig } from '@n8n/config';
import type { AgentChannelRef } from '../utils/agent-channel';
import type { AgentChannelStatus } from '../entities/agent-channel-status.entity';
import { AgentChannelStatusRepository } from '../repositories/agent-channel-status.repository';
export declare class AgentChannelStatusReporter {
    private readonly logger;
    private readonly agentsConfig;
    private readonly repository;
    private hasWithdrawn;
    constructor(logger: Logger, agentsConfig: AgentsConfig, repository: AgentChannelStatusRepository);
    recordConnected(ref: AgentChannelRef): Promise<void>;
    recordFailure(ref: AgentChannelRef, cause: unknown): Promise<void>;
    refreshLease(ref: AgentChannelRef): Promise<void>;
    withdraw(ref: AgentChannelRef): Promise<void>;
    withdrawAll(): Promise<void>;
    isLive(row: Pick<AgentChannelStatus, 'expiresAt'>, now: Date): boolean;
    isRetryReady(row: Pick<AgentChannelStatus, 'backoffUntil'> | undefined, now: Date): boolean;
    private leaseExpiresAt;
    private backoffUntil;
    private intervalMs;
    private swallow;
    private describe;
}
