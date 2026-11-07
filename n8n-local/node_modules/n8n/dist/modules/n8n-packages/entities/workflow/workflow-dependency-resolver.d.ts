import type { User } from '@n8n/db';
import { WorkflowFinderService } from '../../../../workflows/workflow-finder.service';
import type { WorkflowSubWorkflowRequirement } from './workflow.types';
import type { ExportVersionPolicy } from '../../n8n-packages.types';
export interface WorkflowDependencyResolveRequest {
    user: User;
    workflowIds: string[];
    traversal?: 'transitive' | 'direct';
    versionPolicy: ExportVersionPolicy;
}
export declare class WorkflowDependencyResolver {
    private readonly workflowFinder;
    constructor(workflowFinder: WorkflowFinderService);
    resolve(request: WorkflowDependencyResolveRequest): Promise<WorkflowSubWorkflowRequirement[]>;
}
