import { Logger } from '@n8n/backend-common';
import { CollaborationService } from '../../collaboration/collaboration.service';
export declare class WorkflowReviewStateNotifier {
    private readonly logger;
    private readonly collaborationService;
    constructor(logger: Logger, collaborationService: CollaborationService);
    notify(workflowId: string): void;
    notifyMany(workflowIds: string[]): void;
}
