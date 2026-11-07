import { Logger } from '@n8n/backend-common';
import { WorkflowPublishHistoryRepository } from '@n8n/db';
import type { IRunExecutionData, IWorkflowBase } from 'n8n-workflow';
export declare class WorkflowPublisherService {
    private readonly logger;
    private readonly publishHistoryRepository;
    constructor(logger: Logger, publishHistoryRepository: WorkflowPublishHistoryRepository);
    findActingUserIdForRestart(execution: {
        workflowData: Pick<IWorkflowBase, 'id' | 'versionId'>;
        data: Pick<IRunExecutionData, 'manualData'>;
    }): Promise<string | undefined>;
    findPublisherUserId(workflowId: string, executedVersionId: string | null | undefined): Promise<string | undefined>;
}
