import type { User } from '@n8n/db';
import { WorkflowFinderService } from '../../workflows/workflow-finder.service';
export interface AttachableWorkflow {
    id: string;
    name: string;
    published: boolean;
    triggerType: string;
}
export declare class AttachableWorkflowsService {
    private readonly workflowFinderService;
    constructor(workflowFinderService: WorkflowFinderService);
    list(user: User, projectId: string, searchTerm?: string): Promise<AttachableWorkflow[]>;
}
