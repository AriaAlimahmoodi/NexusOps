import { WorkflowRepository, type WorkflowEntity } from '@n8n/db';
import { WorkflowFinderService } from '../../../../workflows/workflow-finder.service';
export interface WorkflowIdConflict {
    sourceWorkflowId: string;
    existingWorkflowId: string;
    existingProjectId: string | null;
    isArchived: boolean;
    name: string;
}
export interface WorkflowLineageConflict {
    sourceWorkflowId: string;
    projectId: string;
    existingWorkflows: Array<{
        id: string;
        name: string;
        isArchived: boolean;
    }>;
}
interface WorkflowImportMatches {
    matches: Map<string, WorkflowEntity>;
    lineageConflicts: WorkflowLineageConflict[];
}
export declare class WorkflowImportMatchService {
    private readonly workflowFinderService;
    private readonly workflowRepository;
    constructor(workflowFinderService: WorkflowFinderService, workflowRepository: WorkflowRepository);
    findOwningProjectsByWorkflowId(workflowIds: string[]): Promise<Map<string, {
        projectId: string | null;
        name: string;
        isArchived: boolean;
    }>>;
    findBySourceWorkflowIds(projectId: string, sourceWorkflowIds: string[]): Promise<WorkflowImportMatches>;
}
export {};
