import type { User } from '@n8n/db';
import { WorkflowFinderService } from '../../../../workflows/workflow-finder.service';
import type { WorkflowDependencyRequirement } from './workflow.types';
import type { ManifestEntry } from '../../spec/manifest.schema';
import type { PackageWorkflowRequirement } from '../../spec/requirements.schema';
export interface WorkflowRequirementExportRequest {
    user: User;
    requirements: WorkflowDependencyRequirement[];
    workflows: ManifestEntry[];
}
export interface WorkflowRequirementExportResult {
    requirements: PackageWorkflowRequirement[];
}
export declare class WorkflowRequirementExporter {
    private readonly workflowFinder;
    constructor(workflowFinder: WorkflowFinderService);
    export(request: WorkflowRequirementExportRequest): Promise<WorkflowRequirementExportResult>;
    private findMissingReferencedWorkflowNames;
}
