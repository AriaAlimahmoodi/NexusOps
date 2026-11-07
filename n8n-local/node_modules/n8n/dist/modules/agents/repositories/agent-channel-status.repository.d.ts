import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceSettings } from 'n8n-core';
import type { AgentChannelStatusValue } from '../entities/agent-channel-status.entity';
import { AgentChannelStatus } from '../entities/agent-channel-status.entity';
import type { AgentChannelRef } from '../utils/agent-channel';
export interface AgentChannelObservation {
    status: AgentChannelStatusValue;
    errorMessage: string | null;
    attempts: number;
    backoffUntil: Date | null;
    expiresAt: Date | null;
}
export declare class AgentChannelStatusRepository extends Repository<AgentChannelStatus> {
    private readonly instanceSettings;
    constructor(dataSource: DataSource, instanceSettings: InstanceSettings);
    saveOwn(ref: AgentChannelRef, observation: AgentChannelObservation): Promise<void>;
    refreshOwnLease(ref: AgentChannelRef, expiresAt: Date | null): Promise<void>;
    clearOwnChannel(ref: AgentChannelRef): Promise<void>;
    clearOwnHost(): Promise<void>;
    findOwnChannel(ref: AgentChannelRef): Promise<AgentChannelStatus | null>;
    findOwnAll(): Promise<AgentChannelStatus[]>;
    findByAgentId(agentId: string): Promise<AgentChannelStatus[]>;
    deleteExpired(now: Date): Promise<number>;
    private own;
}
