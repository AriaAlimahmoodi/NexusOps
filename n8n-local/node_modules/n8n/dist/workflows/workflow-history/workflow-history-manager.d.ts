import { WorkflowHistoryRepository } from '@n8n/db';
import { License } from '../../license';
export declare class WorkflowHistoryManager {
    private workflowHistoryRepo;
    private license;
    constructor(workflowHistoryRepo: WorkflowHistoryRepository, license: License);
    prune(): Promise<void>;
}
