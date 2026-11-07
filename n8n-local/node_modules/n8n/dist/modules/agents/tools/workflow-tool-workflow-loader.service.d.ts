import { WorkflowsConfig } from '@n8n/config';
import { type WorkflowEntity, WorkflowRepository } from '@n8n/db';
import { WorkflowPublishedDataService } from '@n8n/backend-services';
export interface WorkflowToolWorkflowReference {
    workflowId?: string;
    workflowName: string;
}
export interface LoadWorkflowOptions {
    usePublishedVersion?: boolean;
}
export declare class WorkflowToolWorkflowLoader {
    private readonly workflowRepository;
    private readonly workflowsConfig;
    private readonly workflowPublishedDataService;
    constructor(workflowRepository: WorkflowRepository, workflowsConfig: WorkflowsConfig, workflowPublishedDataService: WorkflowPublishedDataService);
    loadWorkflow(projectId: string, reference: WorkflowToolWorkflowReference, options?: LoadWorkflowOptions): Promise<WorkflowEntity | null>;
    private resolvePublishedContent;
}
