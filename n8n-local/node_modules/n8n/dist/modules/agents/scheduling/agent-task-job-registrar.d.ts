import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { ScheduledJobRepository } from '@n8n/db';
import { AgentScheduledJobOwner } from '../../../scheduling/agent-scheduled-job-owner';
import { DurableJobProvisioner } from '../../../scheduling/durable-job-provisioner';
import { AgentTaskSnapshotRepository } from '../repositories/agent-task-snapshot.repository';
import { AgentRepository } from '../repositories/agent.repository';
export declare class AgentTaskJobRegistrar {
    private logger;
    private readonly globalConfig;
    private readonly agentRepository;
    private readonly taskSnapshotRepository;
    private readonly scheduledJobRepository;
    private readonly provisioner;
    private readonly owner;
    constructor(logger: Logger, globalConfig: GlobalConfig, agentRepository: AgentRepository, taskSnapshotRepository: AgentTaskSnapshotRepository, scheduledJobRepository: ScheduledJobRepository, provisioner: DurableJobProvisioner, owner: AgentScheduledJobOwner);
    isEnabled(): boolean;
    reconcile(agentId: string): Promise<void>;
    private applyVersion;
    reconcileAll(): Promise<void>;
    private deprovisionAllAgents;
    private desiredJobFor;
}
