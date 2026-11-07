import type { Folder, Project, User, WorkflowEntity } from '@n8n/db';
import { SharedWorkflowRepository } from '@n8n/db';
import { FolderFinderService } from '@n8n/backend-services';
import { ProjectService } from '../../../../services/project.service.ee';
import { WorkflowFinderService } from '../../../../workflows/workflow-finder.service';
import type { WorkflowSubWorkflowRequirement } from './workflow.types';
import type { ExportVersionPolicy } from '../../n8n-packages.types';
export type WorkflowExportOrigin = 'top-level' | 'folder' | 'project';
export interface WorkflowExportSeed {
    workflowId: string;
    origin: WorkflowExportOrigin;
}
export interface AutoIncludedWorkflow {
    workflow: WorkflowEntity;
    placement: WorkflowExportOrigin;
    ownerProject: Project;
    folderChain: Folder[];
}
export interface AutoIncludedWorkflowResolution {
    autoIncludedWorkflows: AutoIncludedWorkflow[];
}
export declare class AutoIncludedWorkflowResolver {
    private readonly workflowFinder;
    private readonly folderFinder;
    private readonly projectService;
    private readonly sharedWorkflowRepository;
    constructor(workflowFinder: WorkflowFinderService, folderFinder: FolderFinderService, projectService: ProjectService, sharedWorkflowRepository: SharedWorkflowRepository);
    resolve(options: {
        user: User;
        exportedWorkflowIds: string[];
        workflowSeeds: WorkflowExportSeed[];
        requirements: WorkflowSubWorkflowRequirement[];
        includeTags: boolean;
        versionPolicy: ExportVersionPolicy;
    }): Promise<AutoIncludedWorkflowResolution>;
    private seedOrigins;
    private propagateOrigins;
    private buildAutoIncludedWorkflows;
    private choosePlacement;
    private findExportableWorkflows;
    private findAccessibleFolderChains;
}
