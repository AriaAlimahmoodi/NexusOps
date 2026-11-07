import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import type { EntityManager } from '@n8n/db';
import { PollJobManager } from 'n8n-core';
import type { INode, TriggerTime } from 'n8n-workflow';
import { PollBackoffService } from '../../workflows/triggers/poll-backoff.service';
import { DurableJobProvisioner } from '../durable-job-provisioner';
import { WorkflowScheduledJobOwner } from '../workflow-scheduled-job-owner';
export declare class PollTriggerJobRegistrar extends PollJobManager {
    private readonly logger;
    private readonly jobProvisioner;
    private readonly pollBackoffService;
    private readonly owner;
    private readonly defaultTimezone;
    private readonly pollTimeoutSeconds;
    constructor(logger: Logger, globalConfig: GlobalConfig, jobProvisioner: DurableJobProvisioner, pollBackoffService: PollBackoffService, owner: WorkflowScheduledJobOwner);
    register(workflowId: string, node: INode, pollTimes: TriggerTime[], timezone: string): Promise<{
        inserted: boolean;
    }>;
    private toDesiredJobs;
    remove(workflowId: string, nodeId: string): Promise<void>;
    removeWorkflow(workflowId: string): Promise<void>;
    removeWorkflowInTransaction(manager: EntityManager, workflowId: string): Promise<void>;
}
