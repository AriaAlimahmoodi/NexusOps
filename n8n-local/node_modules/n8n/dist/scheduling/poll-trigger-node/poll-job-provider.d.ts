import { Logger } from '@n8n/backend-common';
import { GlobalConfig, WorkflowsConfig } from '@n8n/config';
import { PollTriggerJobRegistrar } from './poll-trigger-job-registrar';
export declare class PollJobProvider {
    private readonly logger;
    private readonly globalConfig;
    private readonly workflowsConfig;
    private readonly pollTriggerJobRegistrar;
    constructor(logger: Logger, globalConfig: GlobalConfig, workflowsConfig: WorkflowsConfig, pollTriggerJobRegistrar: PollTriggerJobRegistrar);
    init(): void;
}
