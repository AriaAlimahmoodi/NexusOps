import { WorkflowFinderService } from '../../../../workflows/workflow-finder.service';
import { WorkflowService } from '../../../../workflows/workflow.service';
import type { WorkflowRemovalPlan, WorkflowRemovalRequest } from './workflow-removal.types';
import type { ImportContext, RemovedWorkflowSummary } from '../../n8n-packages.types';
export declare class WorkflowRemover {
    private readonly workflowFinderService;
    private readonly workflowService;
    constructor(workflowFinderService: WorkflowFinderService, workflowService: WorkflowService);
    plan(context: ImportContext, request: WorkflowRemovalRequest): Promise<WorkflowRemovalPlan>;
    private planExplicitDeletes;
    apply(context: ImportContext, plan: WorkflowRemovalPlan): Promise<RemovedWorkflowSummary[]>;
    private deleteArchived;
}
